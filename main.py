import sys
import re
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()  # Must run before any langchain imports that read env vars

from langgraph.graph import StateGraph, END
from state import GroundTruthState
from agents.planner import run_planner
from agents.researcher import run_researcher
from agents.bias_detector import run_bias_detector
from agents.perspective_analyst import run_perspective_analyst
from agents.propaganda_mapper import run_propaganda_mapper
from agents.fact_checker import run_fact_checker
from agents.synthesizer import run_synthesizer


def build_graph():
    graph = StateGraph(GroundTruthState)

    graph.add_node("planner", run_planner)
    graph.add_node("researcher", run_researcher)
    graph.add_node("bias_detector", run_bias_detector)
    graph.add_node("perspective_analyst", run_perspective_analyst)
    graph.add_node("propaganda_mapper", run_propaganda_mapper)
    graph.add_node("fact_checker", run_fact_checker)
    graph.add_node("synthesizer", run_synthesizer)

    graph.set_entry_point("planner")
    graph.add_edge("planner", "researcher")
    graph.add_edge("researcher", "bias_detector")
    graph.add_edge("bias_detector", "perspective_analyst")
    graph.add_edge("perspective_analyst", "propaganda_mapper")
    graph.add_edge("propaganda_mapper", "fact_checker")
    graph.add_edge("fact_checker", "synthesizer")
    graph.add_edge("synthesizer", END)

    return graph.compile()


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text[:60].strip("-")


def main():
    topic = sys.argv[1] if len(sys.argv) > 1 else input("Enter topic: ").strip()

    if not topic:
        print("[error] Topic cannot be empty.")
        sys.exit(1)

    print(f"\n[GroundTruth] Analyzing: {topic}\n")

    initial_state: GroundTruthState = {
        "topic": topic,
        "angles": [],
        "raw_research": [],
        "bias_report": [],
        "perspective_analysis": {},
        "propaganda_report": [],
        "fact_check": {},
        "confidence_score": 0.0,
        "final_report": "",
        "disclaimer": "",
    }

    compiled_graph = build_graph()

    # Stream for live progress; accumulate to reconstruct full final state
    accumulated = dict(initial_state)
    for step in compiled_graph.stream(initial_state):
        node_name = list(step.keys())[0]
        accumulated.update(step[node_name])
        print(f"  [ok] {node_name} complete")

    final_state = accumulated

    Path("reports").mkdir(exist_ok=True)
    output_path = Path("reports") / f"{slugify(topic)}.md"
    output_path.write_text(final_state["final_report"], encoding="utf-8")
    print(f"\n[GroundTruth] Report saved to {output_path}")


if __name__ == "__main__":
    main()
