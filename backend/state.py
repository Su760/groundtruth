from typing import TypedDict, List


class GroundTruthState(TypedDict):
    topic: str
    angles: List[str]              # from Planner: 4-5 specific investigation angles
    raw_research: List[dict]       # from Researcher: {url, content, source_name, region}
    historical_context: dict       # from ContextHistorian: {timeline, root_causes, why_it_matters_now, key_players_history}
    translation_analysis: dict     # from TranslationLayer: {region: {original_language, translated_samples, naming_conventions, emphasis_patterns, omission_patterns, voice_patterns, key_phrase_differences}}
    bias_report: List[dict]        # from BiasDetector: {source_name, bias_score, flags}
    perspective_analysis: dict     # from PerspectiveAnalyst: {region: {framing, why, interests_served, propaganda_vs_perspective}}
    propaganda_report: List[dict]  # from PropagandaMapper: {source_name, techniques, examples}
    fact_check: dict               # from FactChecker: {confirmed, disputed, unverified}
    confidence_score: float        # 0-1, how confident is the analysis
    final_report: str
    disclaimer: str
