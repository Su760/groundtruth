import json
import asyncio
import threading
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()  # Must run before any langchain imports

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel

from backend.main import build_graph

REPORTS_DIR = Path(__file__).parent.parent / "reports"
ALL_REGIONS = {"China", "Russia", "Middle East", "Europe", "Wire Services", "US/Western", "India", "Global South"}

app = FastAPI(title="GroundTruth API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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
            "bias_report": [],
            "perspective_analysis": {},
            "propaganda_report": [],
            "fact_check": {},
            "confidence_score": 0.0,
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
