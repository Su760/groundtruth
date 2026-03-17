import json
import re
from collections import defaultdict
from langchain_groq import ChatGroq


def parse_json_response(raw: str, fallback):
    cleaned = re.sub(r"^```(?:json)?\s*", "", raw.strip(), flags=re.MULTILINE)
    cleaned = re.sub(r"\s*```$", "", cleaned.strip(), flags=re.MULTILINE)
    try:
        return json.loads(cleaned.strip())
    except json.JSONDecodeError:
        return fallback


def run_perspective_analyst(state: dict) -> dict:
    llm = ChatGroq(model="llama-3.3-70b-versatile")
    raw_research = state["raw_research"]
    topic = state["topic"]
    perspective_analysis = {}

    grouped: dict = defaultdict(list)
    for item in raw_research:
        grouped[item["region"]].append(item)

    for region, articles in grouped.items():
        combined = "\n\n---\n\n".join(
            f"[{a['source_name']} | {a['url']}]\n{a['content']}"
            for a in articles
        )

        prompt = f"""You are a geopolitical media analyst specializing in how nation-states use narrative framing.

Topic being analyzed: "{topic}"
Region/Media ecosystem: {region}

Articles from this region's media:
{combined[:2500]}

Analyze this media ecosystem's coverage across four dimensions:

1. FRAMING: How do they describe what is happening? What language, metaphors, and emphasis do they use?
2. WHY: What structural factors explain this framing? Consider economic interests, military alliances, domestic political pressures, historical grievances, ideological commitments, trade dependencies.
3. INTERESTS_SERVED: Who within this power structure benefits from this narrative? (governments, corporations, political factions)
4. PROPAGANDA_VS_PERSPECTIVE: Is this deliberate state-directed propaganda, or a natural perspective bias emerging from this society's context? What evidence points either way?

Respond with ONLY a JSON object. No markdown fences, no explanation:
{{
  "framing": "<2-3 sentences describing their narrative frame>",
  "why": "<2-3 sentences on structural/political reasons for this framing>",
  "interests_served": "<1-2 sentences on who benefits>",
  "propaganda_vs_perspective": "<1-2 sentences assessing deliberateness>"
}}"""

        response = llm.invoke(prompt)
        result = parse_json_response(response.content, {
            "framing": "[parse error]",
            "why": "[parse error]",
            "interests_served": "[parse error]",
            "propaganda_vs_perspective": "[parse error]",
        })
        perspective_analysis[region] = result

    return {"perspective_analysis": perspective_analysis}
