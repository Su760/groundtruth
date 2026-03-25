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
    historical_context = state.get("historical_context", {})
    translation_analysis = state.get("translation_analysis", {})

    timeline_bullets = "\n".join(
        f"  - {e}" for e in historical_context.get("timeline", [])
    )
    hist_summary = (
        f"Timeline:\n{timeline_bullets}\n"
        f"Root causes: {historical_context.get('root_causes', 'N/A')}\n"
        f"Why it matters now: {historical_context.get('why_it_matters_now', 'N/A')}\n"
        f"Key historical players: {historical_context.get('key_players_history', 'N/A')}"
    )

    bias_summary = "\n".join(
        f"- {b.get('source_name', 'Unknown')}: bias_score={b.get('bias_score', 'N/A')}/10 | "
        f"flags: {'; '.join(b.get('flags', []))}"
        for b in bias_report
    )

    perspective_summary = "\n\n".join(
        f"**{region} Power Bloc**\n"
        f"Narrative: {data.get('narrative_frame', 'N/A')}\n"
        f"Why they frame it this way: {data.get('structural_interests', 'N/A')}\n"
        f"What they gain: {data.get('what_this_bloc_gains', 'N/A')}\n"
        f"Coordinated vs organic: {data.get('deliberate_vs_organic', 'N/A')}"
        for region, data in perspective_analysis.items()
    )

    translation_summary = "\n\n".join(
        f"**{region}** (original: {data.get('original_language', 'unknown')})\n"
        f"Naming: {data.get('naming_conventions', 'N/A')}\n"
        f"Emphasis: {data.get('emphasis_patterns', 'N/A')}\n"
        f"Omissions: {data.get('omission_patterns', 'N/A')}\n"
        f"Voice: {data.get('voice_patterns', 'N/A')}\n"
        f"Key phrases: {'; '.join(data.get('key_phrase_differences', []))}"
        for region, data in translation_analysis.items()
    ) or "No non-English source content analyzed."

    propaganda_summary = "\n".join(
        f"- {p.get('source_name', 'Unknown')}: [{', '.join(p.get('techniques', []))}]\n"
        f"  {chr(10).join('  ' + ex for ex in p.get('examples', []))}"
        for p in propaganda_report
        if p.get("techniques")
    )

    prompt = f"""You are a senior investigative journalist writing a structured media analysis report.

Topic: "{topic}"
Confidence Score: {confidence_score}/1.0 (based on source diversity and cross-verification)

HISTORICAL CONTEXT:
{hist_summary}

TRANSLATION LAYER ANALYSIS (original-language source text):
{translation_summary}

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

## Historical Context
(Summarize the timeline of key events, root causes, why this matters now, and who the historical players are — draw from the HISTORICAL CONTEXT data above)

## Translation Layer
(For each non-English bloc where source text was retrieved: naming conventions, what they emphasize vs omit, voice/agency patterns, key phrase differences vs English coverage)

## What Happened
(2-3 paragraphs summarizing only confirmed facts)

## Power Bloc Narratives
(For each power bloc with data: their narrative frame, WHY based on structural geopolitical interests, what they gain from this narrative, and whether it appears coordinated or organic)

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
