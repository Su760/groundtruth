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

        prompt = f"""You are a geopolitical intelligence analyst specializing in how nation-states and power blocs use narrative control as a foreign policy tool.

Topic: "{topic}"
Power Bloc: {region}

Articles from this bloc's media:
{combined[:2500]}

Analyze this power bloc's coverage across four dimensions:

1. NARRATIVE_FRAME: What specific story are they telling? What language, metaphors, heroes/villains, and emphasis do they use? Quote specific examples where possible.

2. STRUCTURAL_INTERESTS: What concrete geopolitical interests explain this framing? Consider: trade dependencies, military alliances, resource access, territorial disputes, domestic political pressures, historical grievances, ideological commitments, and competition with rival blocs.

3. WHAT_THIS_BLOC_GAINS: Who inside this power structure benefits from this narrative? (governments, military-industrial complex, specific political factions, economic elites) What outcome are they steering the global audience toward?

4. DELIBERATE_VS_ORGANIC: Is this coordinated state-directed information operation, natural perspective bias from this society's context, or somewhere between? What evidence points either way?

Respond ONLY as JSON, no markdown fences:
{{
  "narrative_frame": "<2-3 sentences with specific language examples>",
  "structural_interests": "<2-3 sentences on concrete geopolitical drivers>",
  "what_this_bloc_gains": "<1-2 sentences on beneficiaries and desired outcomes>",
  "deliberate_vs_organic": "<1-2 sentences on coordination vs organic bias>"
}}"""

        response = llm.invoke(prompt)
        result = parse_json_response(response.content, {
            "narrative_frame": "[parse error]",
            "structural_interests": "[parse error]",
            "what_this_bloc_gains": "[parse error]",
            "deliberate_vs_organic": "[parse error]",
        })
        perspective_analysis[region] = result

    return {"perspective_analysis": perspective_analysis}
