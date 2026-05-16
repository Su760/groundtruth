import pytest
from unittest.mock import patch, MagicMock


_BLOCS = ['CN', 'RU', 'ME', 'EU', 'WS', 'US', 'IN', 'GS']

FAKE_BLOC_QUERIES_JSON = '''{
  "CN": {"literal": "Taiwan strait", "entity": "台湾海峡", "framing": "one-China principle"},
  "RU": {"literal": "Taiwan strait", "entity": "Тайваньский пролив", "framing": "provocation by Western powers"},
  "ME": {"literal": "Taiwan strait", "entity": "مضيق تايوان", "framing": "geopolitical rivalry"},
  "EU": {"literal": "Taiwan strait", "entity": "Taiwan Strait", "framing": "rules-based international order"},
  "WS": {"literal": "Taiwan strait", "entity": "Taiwan Strait", "framing": "Taiwan strait tensions"},
  "US": {"literal": "Taiwan strait", "entity": "Taiwan Strait", "framing": "Indo-Pacific security"},
  "IN": {"literal": "Taiwan strait", "entity": "ताइवान जलडमरूमध्य", "framing": "Quad cooperation"},
  "GS": {"literal": "Taiwan strait", "entity": "Taiwan Strait", "framing": "non-aligned movement"}
}'''

FAKE_ANGLES_JSON = '["angle1", "angle2", "angle3", "angle4", "angle5"]'


def _make_mock_llm(responses):
    """Returns a mock LLM that cycles through a list of string responses."""
    mock_llm = MagicMock()
    side_effects = [MagicMock(content=r) for r in responses]
    mock_llm.invoke.side_effect = side_effects
    return mock_llm


def test_run_planner_returns_angles():
    with patch('backend.agents.planner.ChatGroq') as mock_cls:
        mock_cls.return_value = _make_mock_llm([FAKE_ANGLES_JSON, FAKE_BLOC_QUERIES_JSON])
        from backend.agents.planner import run_planner
        result = run_planner({'topic': 'Taiwan strait tensions'})
    assert isinstance(result['angles'], list)
    assert len(result['angles']) == 5


def test_run_planner_returns_bloc_queries_dict():
    with patch('backend.agents.planner.ChatGroq') as mock_cls:
        mock_cls.return_value = _make_mock_llm([FAKE_ANGLES_JSON, FAKE_BLOC_QUERIES_JSON])
        from backend.agents.planner import run_planner
        result = run_planner({'topic': 'Taiwan strait tensions'})
    bq = result.get('bloc_queries')
    assert isinstance(bq, dict), "bloc_queries must be a dict"
    assert set(bq.keys()) == set(_BLOCS), f"Expected all 8 blocs, got {list(bq.keys())}"


def test_run_planner_each_bloc_has_three_variants():
    with patch('backend.agents.planner.ChatGroq') as mock_cls:
        mock_cls.return_value = _make_mock_llm([FAKE_ANGLES_JSON, FAKE_BLOC_QUERIES_JSON])
        from backend.agents.planner import run_planner
        result = run_planner({'topic': 'Taiwan strait tensions'})
    for code, queries in result['bloc_queries'].items():
        assert 'literal' in queries, f"{code} missing 'literal'"
        assert 'entity' in queries, f"{code} missing 'entity'"
        assert 'framing' in queries, f"{code} missing 'framing'"


def test_run_planner_falls_back_gracefully_on_bad_json():
    bad_json = 'this is not json'
    with patch('backend.agents.planner.ChatGroq') as mock_cls:
        mock_cls.return_value = _make_mock_llm([FAKE_ANGLES_JSON, bad_json])
        from backend.agents.planner import run_planner
        result = run_planner({'topic': 'Taiwan strait tensions'})
    bq = result.get('bloc_queries', {})
    assert isinstance(bq, dict)
    for code in _BLOCS:
        assert code in bq
        assert bq[code]['literal'] == 'Taiwan strait tensions'


def test_run_planner_returns_topic_as_query_for_backward_compat():
    with patch('backend.agents.planner.ChatGroq') as mock_cls:
        mock_cls.return_value = _make_mock_llm([FAKE_ANGLES_JSON, FAKE_BLOC_QUERIES_JSON])
        from backend.agents.planner import run_planner
        result = run_planner({'topic': 'Taiwan strait tensions'})
    assert result.get('query') == 'Taiwan strait tensions'
