# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GroundTruth is a multi-agent news analysis system. Given a topic, it researches coverage across global media (Chinese state, Al Jazeera, BBC/DW, RT, US mainstream, Reuters/AP wire), detects bias, maps propaganda techniques, and explains WHY different powers frame the story differently — producing a structured markdown report.

## Setup

```bash
pip install -r requirements.txt
cp .env.example .env
# Fill in GOOGLE_API_KEY and TAVILY_API_KEY in .env
```

## Commands

```bash
# Run with a topic argument
python main.py "Ukraine war"

# Run interactively
python main.py
```

Reports are saved to `reports/<topic-slug>.md`.

## Architecture

Linear LangGraph pipeline — each node receives the full `GroundTruthState` TypedDict and returns a partial state update.

```
planner → researcher → bias_detector → perspective_analyst → propaganda_mapper → fact_checker → synthesizer → END
```

- [state.py](state.py) — shared `GroundTruthState` TypedDict contract; all agents and `main.py` depend on it
- [main.py](main.py) — graph assembly (`build_graph()`), stream loop with `accumulated.update()` pattern, report saving
- [agents/](agents/) — one file per pipeline node, each exports a single `run_*` function

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

### JSON parsing pattern
All LLM calls ask for raw JSON. Agents use `parse_json_response()` to strip markdown fences before `json.loads()`, with explicit fallback values on failure.

### Confidence score formula
`region_diversity * 0.4 + wire_factor * 0.3 + confirmed_ratio * 0.3`
where `wire_factor = 1.0` if Wire Services (Reuters/AP) returned results, else `0.5`.

## Environment

- `GROQ_API_KEY` — Llama 3.3 70B via Groq (all LLM calls)
- `TAVILY_API_KEY` — web search (researcher agent)
