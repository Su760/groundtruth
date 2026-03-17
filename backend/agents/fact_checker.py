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


def run_fact_checker(state: dict) -> dict:
    llm = ChatGroq(model="llama-3.3-70b-versatile")
    raw_research = state["raw_research"]
    topic = state["topic"]

    all_content = "\n\n---\n\n".join(
        f"[{item['source_name']} | {item['region']}]\n{item['content']}"
        for item in raw_research
    )

    # Step 1: Extract key factual claims
    extract_prompt = f"""You are a fact-extraction specialist for news analysis.

Topic: "{topic}"

Below are news articles from multiple international sources. Extract all distinct factual claims
made about this topic. Focus on specific, verifiable claims (numbers, events, dates, attributions),
not opinions or framings.

Articles:
{all_content[:3500]}

Respond with ONLY a JSON array of claim strings. No markdown, no explanation:
["claim one", "claim two", "claim three", ...]

Extract 10-20 of the most significant claims."""

    extract_response = llm.invoke(extract_prompt)
    all_claims = parse_json_response(extract_response.content, [])

    if not all_claims or not isinstance(all_claims, list):
        all_claims = ["[claim extraction failed]"]

    # Step 2: Cross-reference claims across sources
    regions_present = list(set(item["region"] for item in raw_research))
    sources_present = list(set(item["source_name"] for item in raw_research))

    crossref_prompt = f"""You are a fact-checking analyst cross-referencing claims across {len(sources_present)} international news sources.

Sources analyzed: {', '.join(sources_present)}
Regions covered: {', '.join(regions_present)}

Claims to categorize:
{json.dumps(all_claims, indent=2)}

Reference articles:
{all_content[:2500]}

Categorize each claim into exactly one bucket:
- "confirmed": Reported consistently by 3 or more independent sources from different regions, including wire services (Reuters/AP) where possible
- "disputed": Different sources contradict each other on this claim — note the contradiction
- "unverified": Only appears in 1-2 sources with no cross-verification

Respond with ONLY a JSON object. No markdown, no explanation:
{{
  "confirmed": ["<claim>", ...],
  "disputed": ["<claim — Source A says X; Source B says Y>", ...],
  "unverified": ["<claim>", ...]
}}"""

    crossref_response = llm.invoke(crossref_prompt)
    fact_check = parse_json_response(crossref_response.content, {
        "confirmed": [],
        "disputed": [],
        "unverified": all_claims,
    })

    fact_check.setdefault("confirmed", [])
    fact_check.setdefault("disputed", [])
    fact_check.setdefault("unverified", [])

    # Confidence score
    distinct_regions = set(item["region"] for item in raw_research)
    region_diversity = min(len(distinct_regions) / 6, 1.0)
    wire_factor = 1.0 if "Wire Services" in distinct_regions else 0.5
    total_claims = len(fact_check["confirmed"]) + len(fact_check["disputed"]) + len(fact_check["unverified"])
    confirmed_ratio = len(fact_check["confirmed"]) / max(total_claims, 1)
    confidence_score = round(region_diversity * 0.4 + wire_factor * 0.3 + confirmed_ratio * 0.3, 2)

    return {
        "fact_check": fact_check,
        "confidence_score": confidence_score,
    }
