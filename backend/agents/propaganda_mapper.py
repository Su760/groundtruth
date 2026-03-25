import json
import re
from collections import defaultdict
from langchain_groq import ChatGroq


PROPAGANDA_TECHNIQUES = [
    # Emotional manipulation
    "Appeal to fear",
    "Appeal to authority",
    "Appeal to popularity (Bandwagon)",
    "Appeal to nature",
    "Appeal to tradition",
    "Loaded language",
    "Exaggeration or minimization",
    # Logic manipulation
    "Whataboutism",
    "False equivalence",
    "False dilemma (Black-and-white fallacy)",
    "Causal oversimplification",
    "Straw man",
    "Red herring",
    "Reductio ad Hitlerum",
    # Source manipulation
    "Appeal to authority (False authority)",
    "Doubt casting",
    "Smear campaign",
    "Name-calling or labeling",
    # Structural manipulation
    "Selective omission",
    "Repetition",
    "Obfuscation or vagueness",
    "Hero/villain framing",
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

        prompt = f"""You are a propaganda analysis expert trained in the 23 internationally-validated propaganda techniques (SemEval taxonomy) used by state and partisan media.

Source being analyzed: "{source_name}"

Content:
{combined[:2000]}

Identify which of the following 23 propaganda techniques appear in this content. ONLY include techniques that are actually present with clear textual evidence. Do not fabricate detections.

Techniques to check for:
{techniques_list}

Detection instructions:
- PRIMARY techniques: dominant patterns that define the overall framing of this content
- SECONDARY techniques: present but not the main rhetorical strategy
- For each technique found, provide the technique name, a direct quote from the text as evidence, and a 1-sentence explanation of WHY this qualifies as that technique
- If a technique is borderline, note it as "possible: <technique>" in examples

Respond with ONLY a JSON object. No markdown fences, no explanation:
{{
  "source_name": "{source_name}",
  "primary_techniques": ["<technique name>", ...],
  "secondary_techniques": ["<technique name>", ...],
  "examples": [
    "<technique>: '<quoted text>' — <1-sentence explanation>",
    ...
  ]
}}

If no propaganda techniques are clearly present, return empty arrays for all fields."""

        response = llm.invoke(prompt)
        result = parse_json_response(response.content, {
            "source_name": source_name,
            "primary_techniques": [],
            "secondary_techniques": [],
            "examples": [],
        })
        result["source_name"] = source_name
        if not isinstance(result.get("primary_techniques"), list):
            result["primary_techniques"] = []
        if not isinstance(result.get("secondary_techniques"), list):
            result["secondary_techniques"] = []
        if not isinstance(result.get("examples"), list):
            result["examples"] = []
        propaganda_report.append(result)

    return {"propaganda_report": propaganda_report}
