import json
import re
from langchain_groq import ChatGroq


def parse_json_response(raw: str, fallback):
    cleaned = re.sub(r"^```(?:json)?\s*", "", raw.strip(), flags=re.MULTILINE)
    cleaned = re.sub(r"\s*```$", "", cleaned.strip(), flags=re.MULTILINE)
    try:
        return json.loads(cleaned.strip())
    except json.JSONDecodeError:
        return fallback


def run_planner(state: dict) -> dict:
    llm = ChatGroq(model="llama-3.3-70b-versatile")
    topic = state["topic"]

    prompt = f"""You are an investigative research planner specializing in geopolitical and media analysis.

Given this news topic: "{topic}"

Generate exactly 5 specific investigation angles that would help expose how different world powers are framing this story.

Good angles cover dimensions like:
- Military/security implications
- Economic interests at stake
- Humanitarian/civilian impact
- Diplomatic positioning and alliances
- Historical grievances being invoked
- Domestic political use by each government

Respond with ONLY a JSON array of 5 strings. No markdown, no explanation, no code fences.

Example format:
["angle one", "angle two", "angle three", "angle four", "angle five"]"""

    response = llm.invoke(prompt)
    angles = parse_json_response(response.content, [])

    # If LLM returned a dict instead of a list
    if isinstance(angles, dict):
        angles = list(angles.values())

    # Final fallback: split by lines if JSON failed entirely
    if not angles:
        angles = [
            line.strip().strip('"').strip("-").strip()
            for line in response.content.strip().split("\n")
            if line.strip() and not line.strip().startswith("[")
        ][:5]

    return {"angles": angles}
