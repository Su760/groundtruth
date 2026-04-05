import json
import re
import asyncio
import threading
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()  # Must run before any langchain imports

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel

from langchain_groq import ChatGroq
from backend.main import build_graph
from backend.tracker import (
    save_analysis, get_tracked_topics,
    get_topic_history, get_run_count_for_topic, topic_to_slug,
)

REPORTS_DIR = Path(__file__).parent.parent / "reports"
ALL_REGIONS = {"China", "Russia", "Middle East", "Europe", "Wire Services", "US/Western", "India", "Global South"}

app = FastAPI(title="GroundTruth API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

AGENT_LABELS = {
    "planner": "Planner",
    "researcher": "Researcher",
    "context_historian": "Context Historian",
    "translation_layer": "Translation Layer",
    "bias_detector": "Bias Detector",
    "perspective_analyst": "Perspective Analyst",
    "propaganda_mapper": "Propaganda Mapper",
    "fact_checker": "Fact Checker",
    "synthesizer": "Synthesizer",
}


class AnalyzeRequest(BaseModel):
    topic: str
    profile: dict | None = None


class LearnRequest(BaseModel):
    topic: str
    report_content: str | None = None


@app.post("/learn/generate")
async def generate_quiz(req: LearnRequest):
    def _generate():
        llm = ChatGroq(model="llama-3.3-70b-versatile")

        if req.report_content:
            prompt = f"""You are a quiz generator. Create 6 multiple-choice questions to test understanding of this GroundTruth analysis report.

REPORT CONTENT:
{req.report_content[:4000]}

Rules:
- Questions must be answerable from the report content, not general knowledge
- Each question tests comprehension of a specific claim, comparison, or insight in the report
- Wrong answers (distractors) must be plausible but clearly incorrect to someone who read the report
- Include a 1-sentence explanation for the correct answer

Return ONLY valid JSON, no markdown fences:
{{
  "topic": "{req.topic}",
  "source": "report",
  "questions": [
    {{
      "question": "<question text>",
      "options": ["<A>", "<B>", "<C>", "<D>"],
      "correct_index": 0,
      "explanation": "<1 sentence why this is correct>"
    }}
  ]
}}"""
        else:
            prompt = f"""You are a quiz generator specializing in geopolitics and international relations. Create 6 multiple-choice questions about: "{req.topic}"

Rules:
- Questions should test real understanding, not just trivia
- Cover: historical context, key actors/interests, current dynamics, common misconceptions
- Each question should have 4 options (A-D)
- Wrong answers must be plausible but clearly incorrect
- Include a 1-sentence explanation for the correct answer
- Difficulty: intermediate (assumes news literacy, not expert knowledge)

Return ONLY valid JSON, no markdown fences:
{{
  "topic": "{req.topic}",
  "source": "general",
  "questions": [
    {{
      "question": "<question text>",
      "options": ["<A>", "<B>", "<C>", "<D>"],
      "correct_index": 0,
      "explanation": "<1 sentence why this is correct>"
    }}
  ]
}}"""

        raw = llm.invoke(prompt).content
        cleaned = re.sub(r"^```(?:json)?\s*", "", raw.strip(), flags=re.MULTILINE)
        cleaned = re.sub(r"\s*```$", "", cleaned.strip(), flags=re.MULTILINE)
        try:
            return json.loads(cleaned.strip())
        except Exception:
            return {"error": "Failed to parse quiz", "topic": req.topic, "questions": []}

    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, _generate)
    return result


@app.post("/analyze")
async def analyze(req: AnalyzeRequest):
    async def event_generator():
        loop = asyncio.get_event_loop()
        queue: asyncio.Queue = asyncio.Queue()

        initial_state = {
            "topic": req.topic,
            "angles": [],
            "raw_research": [],
            "historical_context": {},
            "translation_analysis": {},
            "user_profile": req.profile or {},
            "bias_report": [],
            "perspective_analysis": {},
            "propaganda_report": [],
            "fact_check": {},
            "confidence_score": 0.0,
            "sources": [],
            "final_report": "",
            "disclaimer": "",
        }

        compiled = build_graph()
        accumulated = dict(initial_state)

        def run_graph_thread():
            try:
                for step in compiled.stream(initial_state):
                    node_name = list(step.keys())[0]
                    accumulated.update(step[node_name])
                    asyncio.run_coroutine_threadsafe(
                        queue.put(("progress", node_name)), loop
                    ).result()
                covered = {r["region"] for r in accumulated.get("raw_research", [])}
                missing = sorted(ALL_REGIONS - covered)
                asyncio.run_coroutine_threadsafe(
                    queue.put(("coverage", missing)), loop
                ).result()
                asyncio.run_coroutine_threadsafe(
                    queue.put(("done", accumulated.get("final_report", ""))), loop
                ).result()
                asyncio.run_coroutine_threadsafe(
                    queue.put(("sources", accumulated.get("sources", []))), loop
                ).result()
                # Save to Supabase AFTER done is queued — user gets report immediately
                save_analysis(accumulated)
            except Exception as e:
                asyncio.run_coroutine_threadsafe(
                    queue.put(("error", str(e))), loop
                ).result()

        thread = threading.Thread(target=run_graph_thread, daemon=True)
        thread.start()

        while True:
            event_type, payload = await queue.get()

            if event_type == "progress":
                label = AGENT_LABELS.get(payload, payload)
                data = json.dumps({
                    "type": "progress",
                    "agent": payload,
                    "message": f"{label} complete",
                })
                yield f"data: {data}\n\n"
            elif event_type == "coverage":
                data = json.dumps({"type": "coverage", "missing_regions": payload})
                yield f"data: {data}\n\n"
            elif event_type == "done":
                data = json.dumps({"type": "done", "report": payload})
                yield f"data: {data}\n\n"
                # no break — wait for sources event
            elif event_type == "sources":
                data = json.dumps({"type": "sources", "data": payload})
                yield f"data: {data}\n\n"
                break
            else:
                data = json.dumps({"type": "error", "message": payload})
                yield f"data: {data}\n\n"
                break

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/tracker")
async def get_tracker():
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, get_tracked_topics)
    return result


@app.get("/tracker/{slug}/count")
async def get_run_count(slug: str):
    loop = asyncio.get_event_loop()
    count = await loop.run_in_executor(None, lambda: get_run_count_for_topic(slug))
    return {"slug": slug, "count": count}


@app.get("/tracker/{slug}")
async def get_topic_tracker(slug: str):
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, lambda: get_topic_history(slug))
    if not result:
        raise HTTPException(status_code=404, detail="Topic not found")
    return result


@app.get("/reports")
async def list_reports():
    if not REPORTS_DIR.exists():
        return JSONResponse([])
    entries = []
    for md_file in REPORTS_DIR.glob("*.md"):
        slug = md_file.stem
        title = slug.replace("-", " ")
        mtime = md_file.stat().st_mtime
        created_at = datetime.fromtimestamp(mtime, tz=timezone.utc).isoformat()
        entries.append({"slug": slug, "title": title, "created_at": created_at})
    entries.sort(key=lambda x: x["created_at"], reverse=True)
    return JSONResponse(entries)
