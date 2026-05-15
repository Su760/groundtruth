from collections import defaultdict
from langchain_groq import ChatGroq

from backend.agents.propaganda_classifier import detect_techniques


def _format_region_table(region_techniques: dict[str, dict[str, int]]) -> str:
    """Format {region: {technique: count}} as a markdown table for the LLM prompt."""
    if not region_techniques:
        return "(no techniques detected)"
    lines = ["| Region | Technique | Count |", "|---|---|---|"]
    for region, techs in sorted(region_techniques.items()):
        for technique, count in sorted(techs.items(), key=lambda x: -x[1]):
            lines.append(f"| {region} | {technique} | {count} |")
    return "\n".join(lines)


def _format_examples(per_article_techniques: list[dict], max_per_technique: int = 2) -> str:
    """Format per-article technique hits as compact bullet examples for the LLM prompt."""
    seen: dict[str, int] = {}
    lines = []
    for entry in per_article_techniques:
        for t in entry["techniques"]:
            name = t["technique"]
            if seen.get(name, 0) >= max_per_technique:
                continue
            seen[name] = seen.get(name, 0) + 1
            excerpt = entry.get("content_excerpt", "")
            lines.append(
                f"- **{name}** ({entry['source']} / {entry['region']}): {excerpt[:200]}"
            )
    return "\n".join(lines) if lines else "(no examples)"


def run_propaganda_mapper(state: dict) -> dict:
    raw_research = state.get("raw_research", [])

    # 1. Run classifier on each article
    per_article_techniques: list[dict] = []
    for item in raw_research:
        techniques = detect_techniques(item.get("content", ""))
        if techniques:
            per_article_techniques.append({
                "url": item.get("url", ""),
                "source": item.get("source_name", ""),
                "region": item.get("region", ""),
                "techniques": techniques,
                "content_excerpt": item.get("content", "")[:300],
            })

    # 2. Aggregate technique counts by region
    region_techniques: dict[str, dict[str, int]] = {}
    for entry in per_article_techniques:
        region = entry["region"]
        if region not in region_techniques:
            region_techniques[region] = {}
        for t in entry["techniques"]:
            name = t["technique"]
            region_techniques[region][name] = region_techniques[region].get(name, 0) + 1

    # 3. LLM writes the narrative using classifier-derived labels
    llm = ChatGroq(model="llama-3.3-70b-versatile")
    llm_prompt = f"""You are analyzing how different geopolitical blocs use propaganda techniques in news coverage. A deterministic classifier has identified the following techniques across {len(raw_research)} articles:

{_format_region_table(region_techniques)}

Example articles per technique:
{_format_examples(per_article_techniques, max_per_technique=2)}

Write a propaganda analysis with:
- Which techniques appear most in each region and why they are strategically useful for that bloc
- Specific examples from the articles with brief quoted evidence
- One-sentence interpretation of each technique's strategic purpose in context

Use markdown. Be concrete. Cite source domains where possible. Focus on patterns, not individual articles."""

    narrative = llm.invoke(llm_prompt).content

    # 4. Build source-level report (backward-compat shape for synthesizer + tracker)
    by_source: dict[str, dict] = defaultdict(lambda: {
        "primary_techniques": [],
        "secondary_techniques": [],
        "examples": [],
    })
    for entry in per_article_techniques:
        source = entry["source"]
        for t in entry["techniques"]:
            name = t["technique"]
            score = t["score"]
            target = by_source[source]["primary_techniques"] if score >= 0.7 else by_source[source]["secondary_techniques"]
            if name not in target:
                target.append(name)

    propaganda_report: list[dict] = [
        {
            "source_name": source,
            "primary_techniques": data["primary_techniques"],
            "secondary_techniques": data["secondary_techniques"],
            "examples": [],
        }
        for source, data in by_source.items()
    ]

    # If classifier found nothing at all, return an empty-but-valid report
    if not propaganda_report:
        propaganda_report = []

    return {
        "propaganda_report": propaganda_report,
        "propaganda_analysis": narrative,
        "propaganda_techniques_per_region": region_techniques,
        "per_article_techniques": [
            {k: v for k, v in e.items() if k != "content_excerpt"}
            for e in per_article_techniques
        ],
    }
