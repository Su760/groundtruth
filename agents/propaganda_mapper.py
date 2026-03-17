import json
import re
from collections import defaultdict
from langchain_groq import ChatGroq


PROPAGANDA_TECHNIQUES = [
    "Whataboutism",
    "Appeal to fear",
    "Selective omission",
    "Loaded language",
    "False equivalence",
    "Hero/villain framing",
    "Appeal to authority",
    "Scapegoating",
    "Bandwagon appeal",
    "Dehumanization",
]


def parse_json_response(raw: str, fallback):
    cleaned = re.sub(r"^```(?:json)?\s*", "", raw.strip(), flags=re.MULTILINE)
    cleaned = re.sub(r"\s*```$", "", cleaned.strip(), flags=re.MULTILINE)
    try:
        return json.loads(cleaned.strip())
    except json.JSONDecodeError:
        return fallback


def run_propaganda_mapper(state: dict) -> dict:
    llm = ChatGroq(model="llama-3.3-70b-versatile")
    raw_research = state["raw_research"]
    propaganda_report = []

    grouped: dict = defaultdict(list)
    for item in raw_research:
        grouped[item["source_name"]].append(item)

    techniques_list = "\n".join(f"- {t}" for t in PROPAGANDA_TECHNIQUES)

    for source_name, articles in grouped.items():
        combined = "\n\n---\n\n".join(
            f"[{a['url']}]\n{a['content']}"
            for a in articles
        )

        prompt = f"""You are a propaganda analysis expert trained in rhetorical techniques used by state and partisan media.

Source being analyzed: "{source_name}"

Content:
{combined[:2000]}

Identify which of the following propaganda techniques appear in this content. ONLY include techniques
that are actually present with clear textual evidence. Do not fabricate detections.

Techniques to check for:
{techniques_list}

Respond with ONLY a JSON object. No markdown fences, no explanation:
{{
  "source_name": "{source_name}",
  "techniques": ["<technique name>", "<technique name>"],
  "examples": [
    "<technique name>: <quoted text from the article that demonstrates this technique>",
    "<technique name>: <another quoted example>"
  ]
}}

If no propaganda techniques are clearly present, return empty arrays for both fields."""

        response = llm.invoke(prompt)
        result = parse_json_response(response.content, {
            "source_name": source_name,
            "techniques": [],
            "examples": [],
        })
        result["source_name"] = source_name
        if not isinstance(result.get("techniques"), list):
            result["techniques"] = []
        if not isinstance(result.get("examples"), list):
            result["examples"] = []
        propaganda_report.append(result)

    return {"propaganda_report": propaganda_report}
