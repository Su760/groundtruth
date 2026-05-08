import pytest
from backend.agents.sources import BLOC_SOURCES, get_bloc_sources, BlocSources


def test_all_eight_blocs_present():
    expected_codes = {"CN", "RU", "ME", "EU", "WS", "US", "IN", "GS"}
    assert set(BLOC_SOURCES.keys()) == expected_codes


def test_region_names_match_all_regions():
    """region names must match server.py ALL_REGIONS exactly."""
    ALL_REGIONS = {
        "China", "Russia", "Middle East", "Europe",
        "Wire Services", "US/Western", "India", "Global South"
    }
    actual = {src.name for src in BLOC_SOURCES.values()}
    assert actual == ALL_REGIONS


def test_get_by_code():
    src = get_bloc_sources("CN")
    assert src is not None
    assert src.name == "China"
    assert src.code == "CN"


def test_get_by_name():
    src = get_bloc_sources("Russia")
    assert src is not None
    assert src.code == "RU"


def test_get_case_insensitive():
    assert get_bloc_sources("china") is not None
    assert get_bloc_sources("RUSSIA") is not None


def test_get_unknown_returns_none():
    assert get_bloc_sources("ZZZZ") is None


def test_each_bloc_has_rss_or_gdelt():
    """Every bloc must have at least one data source."""
    for code, src in BLOC_SOURCES.items():
        assert src.rss_feeds or src.gdelt_domains, \
            f"Bloc {code} has no rss_feeds and no gdelt_domains"


def test_wire_services_has_gdelt_no_rss():
    ws = get_bloc_sources("WS")
    assert ws.rss_feeds == []
    assert len(ws.gdelt_domains) > 0
