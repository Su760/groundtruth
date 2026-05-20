from typing import TypedDict, List, Optional


class GroundTruthState(TypedDict):
    topic: str
    angles: List[str]              # from Planner: 4-5 specific investigation angles
    bloc_queries: Optional[dict]   # from Planner: {bloc_code: {literal, entity, framing}}
    raw_research: List[dict]       # from Researcher: {url, content, source_name, region}
    historical_context: dict       # from ContextHistorian: {timeline, root_causes, why_it_matters_now, key_players_history}
    translation_analysis: dict     # from TranslationLayer: {region: {original_language, translated_samples, naming_conventions, emphasis_patterns, omission_patterns, voice_patterns, key_phrase_differences}}
    user_profile: dict             # from frontend: {expertise_level, tone, depth, emphasized_blocs, goal, frustration}
    bias_report: List[dict]        # from BiasDetector: {source_name, bias_score, flags}
    perspective_analysis: dict     # from PerspectiveAnalyst: {region: {framing, why, interests_served, propaganda_vs_perspective}}
    propaganda_report: List[dict]  # from PropagandaMapper: {source_name, primary_techniques, secondary_techniques, examples}
    propaganda_analysis: str       # from PropagandaMapper: LLM narrative explaining technique patterns by region
    propaganda_techniques_per_region: dict  # from PropagandaMapper: {region: {technique: count}} — classifier-derived, deterministic
    per_article_techniques: List[dict]      # from PropagandaMapper: [{url, source, region, techniques}]
    fact_check: dict               # from FactChecker: {confirmed, disputed, unverified}
    confidence_score: float        # 0-1, how confident is the analysis
    sources: List[dict]            # [{title, url, agent}] — from Researcher + ContextHistorian
    final_report: str
    disclaimer: str
    patterns_analysis: Optional[dict]     # from PatternsAnalyst: {alignment_clusters, fault_lines, conspicuous_absences, dominant_technique, one_sentence_meta}
