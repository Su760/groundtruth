import json
import re
from langchain_groq import ChatGroq


_BLOCS = ['CN', 'RU', 'ME', 'EU', 'WS', 'US', 'IN', 'GS']

_BLOC_QUERY_PROMPT = """\
You are a research strategist for a multi-perspective news analysis pipeline. The topic is: {topic}

Generate 3 search query variants per geopolitical bloc. Each variant should target a different angle:
- 'literal': the topic phrased as it would appear in mainstream English news
- 'entity': key actors/places transliterated or referred to as the bloc's media would \
(e.g. Taiwan → 台湾 for CN, Ukraine → Украина for RU). Use the bloc's native language where possible.
- 'framing': the topic phrased using the bloc's known framing terminology \
(e.g. CN: 'one-China principle', RU: 'special military operation', \
US: 'Indo-Pacific security', IN: 'Quad cooperation', GS: 'non-aligned movement', \
ME: 'Zionist entity', EU: 'rules-based order')

The 8 blocs: CN (China), RU (Russia), ME (Middle East), EU (Europe), \
WS (Wire Services), US (US/Western), IN (India), GS (Global South).

Return ONLY valid JSON in this exact shape:
{{
  "CN": {{"literal": "...", "entity": "...", "framing": "..."}},
  "RU": {{"literal": "...", "entity": "...", "framing": "..."}},
  "ME": {{"literal": "...", "entity": "...", "framing": "..."}},
  "EU": {{"literal": "...", "entity": "...", "framing": "..."}},
  "WS": {{"literal": "...", "entity": "...", "framing": "..."}},
  "US": {{"literal": "...", "entity": "...", "framing": "..."}},
  "IN": {{"literal": "...", "entity": "...", "framing": "..."}},
  "GS": {{"literal": "...", "entity": "...", "framing": "..."}}
}}"""


def parse_json_response(raw: str, fallback):
    cleaned = re.sub(r"^```(?:json)?\s*", "", raw.strip(), flags=re.MULTILINE)
    cleaned = re.sub(r"\s*```$", "", cleaned.strip(), flags=re.MULTILINE)
    try:
        return json.loads(cleaned.strip())
    except json.JSONDecodeError:
        return fallback


def _fallback_bloc_queries(topic: str) -> dict:
    return {code: {'literal': topic, 'entity': topic, 'framing': topic} for code in _BLOCS}


def run_planner(state: dict) -> dict:
    llm = ChatGroq(model="llama-3.3-70b-versatile")
    topic = state["topic"]

    # --- Call 1: investigation angles (existing behavior preserved) ---
    angles_prompt = f"""You are an investigative research planner specializing in geopolitical and media analysis.

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

    angles_response = llm.invoke(angles_prompt)
    angles = parse_json_response(angles_response.content, [])

    if isinstance(angles, dict):
        angles = list(angles.values())

    if not angles:
        angles = [
            line.strip().strip('"').strip("-").strip()
            for line in angles_response.content.strip().split("\n")
            if line.strip() and not line.strip().startswith("[")
        ][:5]

    # --- Call 2: per-bloc query variants ---
    bloc_prompt = _BLOC_QUERY_PROMPT.format(topic=topic)
    bloc_response = llm.invoke(bloc_prompt)
    bloc_queries = parse_json_response(bloc_response.content, None)

    if not isinstance(bloc_queries, dict) or not all(c in bloc_queries for c in _BLOCS):
        print(f"    [planner] bloc_queries parse failed — using topic fallback")
        bloc_queries = _fallback_bloc_queries(topic)

    return {
        'angles': angles,
        'bloc_queries': bloc_queries,
        'query': topic,
    }
