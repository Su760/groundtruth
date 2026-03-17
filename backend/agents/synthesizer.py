import json
from langchain_groq import ChatGroq


DISCLAIMER = (
    "This is AI-assisted analysis. Treat as a starting point for critical thinking, "
    "not a final verdict. Sources may be incomplete, and LLM analysis has inherent limitations."
)


def run_synthesizer(state: dict) -> dict:
    llm = ChatGroq(model="llama-3.3-70b-versatile")
    topic = state["topic"]
    confidence_score = state["confidence_score"]
    fact_check = state["fact_check"]
    bias_report = state["bias_report"]
    perspective_analysis = state["perspective_analysis"]
    propaganda_report = state["propaganda_report"]

    bias_summary = "\n".join(
        f"- {b.get('source_name', 'Unknown')}: bias_score={b.get('bias_score', 'N/A')}/10 | "
        f"flags: {'; '.join(b.get('flags', []))}"
        for b in bias_report
    )

    perspective_summary = "\n\n".join(
        f"**{region}**\n"
        f"Framing: {data.get('framing', 'N/A')}\n"
        f"Why: {data.get('why', 'N/A')}\n"
        f"Interests served: {data.get('interests_served', 'N/A')}\n"
        f"Propaganda vs perspective: {data.get('propaganda_vs_perspective', 'N/A')}"
        for region, data in perspective_analysis.items()
    )

    propaganda_summary = "\n".join(
        f"- {p.get('source_name', 'Unknown')}: [{', '.join(p.get('techniques', []))}]\n"
        f"  {chr(10).join('  ' + ex for ex in p.get('examples', []))}"
        for p in propaganda_report
        if p.get("techniques")
    )

    prompt = f"""You are a senior investigative journalist writing a structured media analysis report.

Topic: "{topic}"
Confidence Score: {confidence_score}/1.0 (based on source diversity and cross-verification)

=== ANALYSIS DATA ===

CONFIRMED FACTS (verified across multiple independent sources):
{json.dumps(fact_check.get('confirmed', []), indent=2)}

DISPUTED CLAIMS (sources contradict each other):
{json.dumps(fact_check.get('disputed', []), indent=2)}

UNVERIFIED CLAIMS (1-2 sources only):
{json.dumps(fact_check.get('unverified', []), indent=2)}

BIAS ANALYSIS BY SOURCE:
{bias_summary}

HOW EACH REGION IS FRAMING THIS:
{perspective_summary}

PROPAGANDA TECHNIQUES DETECTED:
{propaganda_summary if propaganda_summary else "No clear propaganda techniques detected across sources."}

=== INSTRUCTIONS ===
Write a structured markdown report using EXACTLY these section headers in this order.
Base every claim on the data above. Do not introduce facts not present in the analysis data.
Write clearly for a general reader who wants to understand media manipulation.

## What Happened
(2-3 paragraphs summarizing only confirmed facts)

## How Different Powers Are Framing This
(For each region with data: what they say, WHY they say it based on interests, and what that means for the reader)

## Propaganda Techniques Detected
(Per source that had detections: technique used and specific example from their coverage)

## Confirmed Facts
(Bullet list of confirmed claims)

## Disputed Claims
(Bullet list showing the contradiction: "Source A says X; Source B says Y" format)

## What To Keep In Mind
(Exactly 3-4 bullet points of critical thinking reminders for the reader when following this story)

Write the full report now."""

    response = llm.invoke(prompt)

    final_report = f"# GroundTruth Analysis: {topic}\n\n"
    final_report += f"**Confidence Score: {confidence_score}/1.0**\n\n"
    final_report += response.content.strip()
    final_report += f"\n\n---\n\n*{DISCLAIMER}*\n"

    return {
        "final_report": final_report,
        "disclaimer": DISCLAIMER,
    }
