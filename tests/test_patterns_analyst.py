import pytest
from unittest.mock import patch, MagicMock

FAKE_PATTERNS_JSON = '''{
  "alignment_clusters": [
    {
      "blocs": ["CN", "RU"],
      "shared_narrative": "Both frame US involvement as destabilizing interference",
      "why_aligned": "Strategic partnership against Western hegemony"
    }
  ],
  "fault_lines": [
    {
      "bloc_a": "CN",
      "bloc_b": "US",
      "disagreement": "CN frames Taiwan as internal sovereignty issue; US frames it as regional security",
      "what_it_reveals": "Incompatible foundational assumptions about territorial integrity vs democratic self-determination"
    }
  ],
  "conspicuous_absences": [
    "No bloc discussed the views of Taiwanese citizens themselves",
    "Economic interdependence costs of conflict absent from all coverage"
  ],
  "dominant_technique": {
    "technique": "Loaded_Language",
    "blocs_using_it": ["CN", "RU", "ME"],
    "interpretation": "Emotional framing dominates because rational argument alone cannot justify each bloc position"
  },
  "one_sentence_meta": "CN-RU alignment on anti-Western framing masks divergent economic stakes in Taiwan stability"
}'''


def _make_mock_llm(response):
    mock = MagicMock()
    mock.invoke.return_value = MagicMock(content=response)
    return mock


SAMPLE_STATE = {
    'topic': 'Taiwan strait tensions',
    'perspective_analysis': {
        'China': {
            'narrative_frame': 'Taiwan is a renegade province; US interference destabilizes',
            'structural_interests': 'Reunification is core to CPC legitimacy',
            'what_this_bloc_gains': 'Domestic nationalist support',
            'deliberate_vs_organic': 'Highly deliberate state media coordination',
        },
        'Russia': {
            'narrative_frame': 'US provocations escalate unnecessary conflict',
            'structural_interests': 'Weaken US credibility globally',
            'what_this_bloc_gains': 'Distraction from Ukraine, strategic alignment with China',
            'deliberate_vs_organic': 'Deliberate amplification of Chinese framing',
        },
        'US/Western': {
            'narrative_frame': 'China threatens regional stability and democratic Taiwan',
            'structural_interests': 'Maintain Indo-Pacific influence and alliance credibility',
            'what_this_bloc_gains': 'Justification for defense spending and alliances',
            'deliberate_vs_organic': 'Organic within shared Western liberal framing',
        },
    },
    'propaganda_techniques_per_region': {
        'China': {'Loaded_Language': 3, 'Appeal_to_Authority': 2},
        'Russia': {'Loaded_Language': 4, 'Flag_Waving': 2},
        'US/Western': {'Appeal_to_Fear': 2, 'Loaded_Language': 1},
    },
    'bias_report': [],
    'final_report': '# GroundTruth Analysis\n\nExisting report content.',
}


def test_run_patterns_analyst_returns_patterns_key():
    with patch('backend.agents.patterns_analyst.ChatGroq') as mock_cls:
        mock_cls.return_value = _make_mock_llm(FAKE_PATTERNS_JSON)
        from backend.agents.patterns_analyst import run_patterns_analyst
        result = run_patterns_analyst(SAMPLE_STATE)
    assert 'patterns_analysis' in result
    assert isinstance(result['patterns_analysis'], dict)


def test_run_patterns_analyst_returns_updated_report():
    with patch('backend.agents.patterns_analyst.ChatGroq') as mock_cls:
        mock_cls.return_value = _make_mock_llm(FAKE_PATTERNS_JSON)
        from backend.agents.patterns_analyst import run_patterns_analyst
        result = run_patterns_analyst(SAMPLE_STATE)
    assert 'final_report' in result
    assert '## Cross-Bloc Pattern Analysis' in result['final_report']
    assert 'Alignment Clusters' in result['final_report']


def test_patterns_section_appended_after_existing_report():
    with patch('backend.agents.patterns_analyst.ChatGroq') as mock_cls:
        mock_cls.return_value = _make_mock_llm(FAKE_PATTERNS_JSON)
        from backend.agents.patterns_analyst import run_patterns_analyst
        result = run_patterns_analyst(SAMPLE_STATE)
    report = result['final_report']
    assert 'Existing report content.' in report
    existing_idx = report.index('Existing report content.')
    patterns_idx = report.index('## Cross-Bloc Pattern Analysis')
    assert existing_idx < patterns_idx


def test_falls_back_gracefully_on_bad_json():
    with patch('backend.agents.patterns_analyst.ChatGroq') as mock_cls:
        mock_cls.return_value = _make_mock_llm('this is not json at all')
        from backend.agents.patterns_analyst import run_patterns_analyst
        result = run_patterns_analyst(SAMPLE_STATE)
    assert 'patterns_analysis' in result
    assert result['patterns_analysis'].get('one_sentence_meta') == '[parse error]'


def test_format_includes_fault_lines():
    with patch('backend.agents.patterns_analyst.ChatGroq') as mock_cls:
        mock_cls.return_value = _make_mock_llm(FAKE_PATTERNS_JSON)
        from backend.agents.patterns_analyst import run_patterns_analyst
        result = run_patterns_analyst(SAMPLE_STATE)
    assert 'Narrative Fault Lines' in result['final_report']
    assert 'CN vs US' in result['final_report']


def test_format_includes_absences():
    with patch('backend.agents.patterns_analyst.ChatGroq') as mock_cls:
        mock_cls.return_value = _make_mock_llm(FAKE_PATTERNS_JSON)
        from backend.agents.patterns_analyst import run_patterns_analyst
        result = run_patterns_analyst(SAMPLE_STATE)
    assert 'What Every Bloc Avoided' in result['final_report']


def test_works_with_empty_perspective_analysis():
    state = {**SAMPLE_STATE, 'perspective_analysis': {},
             'propaganda_techniques_per_region': {}}
    with patch('backend.agents.patterns_analyst.ChatGroq') as mock_cls:
        mock_cls.return_value = _make_mock_llm(FAKE_PATTERNS_JSON)
        from backend.agents.patterns_analyst import run_patterns_analyst
        result = run_patterns_analyst(state)
    assert 'patterns_analysis' in result
