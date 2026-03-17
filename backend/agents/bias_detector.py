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


def run_bias_detector(state: dict) -> dict:
    llm = ChatGroq(model="llama-3.3-70b-versatile")
    raw_research = state["raw_research"]
    bias_report = []

    grouped: dict = defaultdict(list)
    for item in raw_research:
        grouped[item["source_name"]].append(item)

    for source_name, articles in grouped.items():
        combined_content = "\n\n---\n\n".join(
            f"[Article: {a['url']}]\n{a['content']}"
            for a in articles
        )

        prompt = f"""You are a media bias analyst with expertise in international news.

Analyze the following content from "{source_name}" and assess its bias.

Content:
{combined_content[:2000]}

Return ONLY a JSON object with exactly this structure. No markdown fences, no explanation:
{{
  "source_name": "{source_name}",
  "bias_score": <integer 1-10, where 1=strongly state-aligned/left-nationalist, 5=neutral, 10=strongly right-nationalist>,
  "flags": [
    "<specific bias flag with a quoted example from the text>",
    "<another flag with quoted example>"
  ]
}}

Bias flags to look for: loaded language, selective omission, hero/villain framing, appeal to emotion,
strawman characterization, false balance, state narrative alignment, whataboutism.
Each flag MUST include a specific quoted phrase from the content as evidence."""

        response = llm.invoke(prompt)
        result = parse_json_response(response.content, {
            "source_name": source_name,
            "bias_score": 5,
            "flags": ["[parse error — no flags extracted]"],
        })

        # Prevent LLM from overwriting source_name with hallucinated value
        result["source_name"] = source_name
        if not isinstance(result.get("flags"), list):
            result["flags"] = []
        bias_report.append(result)

    return {"bias_report": bias_report}
