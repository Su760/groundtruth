# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GroundTruth is a multi-agent news analysis system with a React + FastAPI web interface. Given a topic, it researches coverage across global media (Chinese state, Al Jazeera, BBC/DW, RT, US mainstream, Reuters/AP wire), detects bias, maps propaganda techniques, and explains WHY different powers frame the story differently — producing a structured markdown report streamed live to the browser.

## Setup

```bash
# Backend
pip install -r requirements.txt
cp .env.example .env
# Fill in GROQ_API_KEY and TAVILY_API_KEY in .env

# Frontend
cd frontend && npm install
```

## Commands

```bash
# Backend dev server
uvicorn backend.server:app --host 0.0.0.0 --port 8000 --reload

# Frontend dev server
cd frontend && npm run dev

# CLI (runs the pipeline without the web UI)
python main.py "Ukraine war"
# or: python -m backend.main "Ukraine war"
```

Reports saved by CLI to `reports/<topic-slug>.md`.

## Architecture

### Backend

Linear LangGraph pipeline — each node receives the full `GroundTruthState` TypedDict and returns a partial state update.

```
planner → researcher → bias_detector → perspective_analyst → propaganda_mapper → fact_checker → synthesizer → END
```

- [backend/state.py](backend/state.py) — shared `GroundTruthState` TypedDict contract
- [backend/main.py](backend/main.py) — `build_graph()` function + CLI `main()`, imports from `backend.*`
- [backend/server.py](backend/server.py) — FastAPI app; POST `/analyze` streams SSE via `StreamingResponse`. Runs LangGraph in a daemon thread, communicates back to the async SSE generator via `asyncio.Queue` + `run_coroutine_threadsafe`
- [backend/agents/](backend/agents/) — one file per pipeline node, each exports a single `run_*` function
- Root [main.py](main.py) — thin CLI wrapper that delegates to `backend.main`

SSE event format:
```json
{"type": "progress", "agent": "planner", "message": "Planner complete"}
{"type": "done", "report": "<full markdown string>"}
{"type": "error", "message": "..."}
```

### Frontend

Vite + React 18 + React Router v6 + react-markdown + Tailwind v3.

- [frontend/src/pages/Landing.jsx](frontend/src/pages/Landing.jsx) — hero, topic input, 3 feature cards
- [frontend/src/pages/Analyze.jsx](frontend/src/pages/Analyze.jsx) — SSE consumer, agent progress sidebar, markdown report renderer
- [frontend/src/index.css](frontend/src/index.css) — Tailwind directives + `.report-content` markdown styles

SSE is consumed via `fetch()` + `ReadableStream` reader (not `EventSource` — POST endpoint). Chunks are buffered and split on `\n\n` to handle partial SSE frames.

### Agent responsibilities

| Agent | Input used | Output field |
|---|---|---|
| planner | `topic` | `angles` |
| researcher | `topic` | `raw_research` (6 Tavily searches by region, deduped by URL, content truncated to 800 chars) |
| bias_detector | `raw_research` | `bias_report` (grouped by source_name, one LLM call each) |
| perspective_analyst | `raw_research`, `topic` | `perspective_analysis` (grouped by region) |
| propaganda_mapper | `raw_research` | `propaganda_report` (grouped by source_name) |
| fact_checker | `raw_research`, `topic` | `fact_check`, `confidence_score` (two-pass: extract claims → cross-reference) |
| synthesizer | all prior fields | `final_report`, `disclaimer` |

### Confidence score formula
`region_diversity * 0.4 + wire_factor * 0.3 + confirmed_ratio * 0.3`
where `wire_factor = 1.0` if Wire Services (Reuters/AP) returned results, else `0.5`.

## Environment

- `GROQ_API_KEY` — Llama 3.3 70B via Groq (all LLM calls)
- `TAVILY_API_KEY` — web search (researcher agent)
