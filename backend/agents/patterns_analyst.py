import json
import re
from langchain_groq import ChatGroq


def _parse_json(raw: str, fallback: dict) -> dict:
    cleaned = re.sub(r'^```(?:json)?\s*', '', raw.strip(), flags=re.MULTILINE)
    cleaned = re.sub(r'\s*```$', '', cleaned.strip(), flags=re.MULTILINE)
    try:
        return json.loads(cleaned.strip())
    except Exception:
        return fallback


def run_patterns_analyst(state: dict) -> dict:
    topic = state.get('topic', '')
    perspective_analysis = state.get('perspective_analysis', {})
    propaganda_per_region = state.get('propaganda_techniques_per_region', {})

    bloc_summaries = []
    for region, data in perspective_analysis.items():
        propaganda = propaganda_per_region.get(region, {})
        top_techniques = sorted(propaganda.items(), key=lambda x: x[1], reverse=True)[:3]
        techniques_str = ', '.join(f"{t}({c})" for t, c in top_techniques) or 'none detected'
        bloc_summaries.append(
            f"BLOC: {region}\n"
            f"  Narrative frame: {data.get('narrative_frame', 'N/A')[:200]}\n"
            f"  Structural interests: {data.get('structural_interests', 'N/A')[:150]}\n"
            f"  Top propaganda techniques: {techniques_str}"
        )

    bloc_text = '\n\n'.join(bloc_summaries)

    prompt = f"""You are a senior geopolitical analyst performing cross-bloc meta-analysis.

Topic: {topic}

Below are the narrative frames and propaganda patterns for each geopolitical bloc:

{bloc_text}

Perform cross-bloc meta-analysis. Be specific and concrete — cite actual blocs
and actual narrative differences. Do not repeat what individual blocs said;
find the PATTERNS ACROSS them.

Return ONLY valid JSON in this exact shape:

{{
  "alignment_clusters": [
    {{
      "blocs": ["CN", "RU"],
      "shared_narrative": "One sentence describing what these blocs agree on",
      "why_aligned": "One sentence on why these blocs share this frame"
    }}
  ],
  "fault_lines": [
    {{
      "bloc_a": "CN",
      "bloc_b": "US",
      "disagreement": "One sentence on the core framing conflict",
      "what_it_reveals": "One sentence on what underlying interest this exposes"
    }}
  ],
  "conspicuous_absences": [
    "One concrete thing NO bloc discussed or acknowledged"
  ],
  "dominant_technique": {{
    "technique": "most common propaganda technique across all blocs",
    "blocs_using_it": ["CN", "RU", "ME"],
    "interpretation": "One sentence on what this convergence of technique means"
  }},
  "one_sentence_meta": "The single most important cross-bloc insight from this analysis"
}}

Rules:
- alignment_clusters: 1-3 clusters only. Only group blocs that genuinely share a frame.
- fault_lines: 2-4 lines only. Most important disagreements.
- conspicuous_absences: 2-4 items. Must be things truly absent from ALL blocs, not just one.
- dominant_technique: pick ONE technique that appears most across blocs.
- one_sentence_meta: max 30 words. The headline insight.
"""

    llm = ChatGroq(model='llama-3.3-70b-versatile', temperature=0)
    raw = llm.invoke(prompt).content

    patterns = _parse_json(raw, {
        'alignment_clusters': [],
        'fault_lines': [],
        'conspicuous_absences': [],
        'dominant_technique': {},
        'one_sentence_meta': '[parse error]',
    })

    patterns_section = _format_patterns_section(patterns)
    existing_report = state.get('final_report', '')
    updated_report = existing_report + '\n\n' + patterns_section

    print(f"    [patterns_analyst] Cross-bloc analysis complete: "
          f"{len(patterns.get('alignment_clusters', []))} clusters, "
          f"{len(patterns.get('fault_lines', []))} fault lines, "
          f"{len(patterns.get('conspicuous_absences', []))} absences")

    return {
        'patterns_analysis': patterns,
        'final_report': updated_report,
    }


def _format_patterns_section(patterns: dict) -> str:
    lines = ['## Cross-Bloc Pattern Analysis']

    meta = patterns.get('one_sentence_meta', '')
    if meta and meta != '[parse error]':
        lines.append(f'\n> {meta}')

    clusters = patterns.get('alignment_clusters', [])
    if clusters:
        lines.append('\n### Alignment Clusters')
        for c in clusters:
            blocs = ' + '.join(c.get('blocs', []))
            lines.append(f'\n**{blocs}** — {c.get("shared_narrative", "")}')
            why = c.get('why_aligned', '')
            if why:
                lines.append(f'*Why aligned: {why}*')

    faults = patterns.get('fault_lines', [])
    if faults:
        lines.append('\n### Narrative Fault Lines')
        for f in faults:
            a = f.get('bloc_a', '')
            b = f.get('bloc_b', '')
            lines.append(f'\n**{a} vs {b}** — {f.get("disagreement", "")}')
            reveal = f.get('what_it_reveals', '')
            if reveal:
                lines.append(f'*What this reveals: {reveal}*')

    absences = patterns.get('conspicuous_absences', [])
    if absences:
        lines.append('\n### What Every Bloc Avoided')
        for a in absences:
            lines.append(f'- {a}')

    dominant = patterns.get('dominant_technique', {})
    if dominant and dominant.get('technique'):
        technique = dominant['technique']
        blocs = ', '.join(dominant.get('blocs_using_it', []))
        interp = dominant.get('interpretation', '')
        lines.append(f'\n### Convergent Technique: {technique}')
        lines.append(f'Used by: {blocs}')
        if interp:
            lines.append(f'\n{interp}')

    return '\n'.join(lines)
