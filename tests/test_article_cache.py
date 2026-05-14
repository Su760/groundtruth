import pytest
from unittest.mock import MagicMock, patch
from backend.agents.extractors import Article


@pytest.fixture
def mock_supabase():
    """Returns a mock supabase client wired into article_cache module."""
    mock = MagicMock()
    with patch("backend.agents.article_cache.supabase", mock):
        yield mock


def _make_article(**kwargs) -> Article:
    defaults = dict(
        url="https://xinhua.net/story/123",
        title="Test",
        body="Some body text that is long enough to pass validation checks here.",
        source_domain="xinhua.net",
        bloc_code="CN",
        published=None,
        language="zh",
    )
    defaults.update(kwargs)
    return Article(**defaults)


def test_get_cached_miss(mock_supabase):
    """Returns None when URL not in cache."""
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
    from backend.agents import article_cache
    result = article_cache.get_cached("https://xinhua.net/story/123")
    assert result is None


def test_get_cached_hit(mock_supabase):
    """Returns Article when URL is in cache and touches last_used_at."""
    row = {
        "url": "https://xinhua.net/story/123",
        "title": "Test",
        "body": "body text",
        "source_domain": "xinhua.net",
        "bloc_code": "CN",
        "published": None,
        "language": "zh",
        "url_hash": "abc123",
    }
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [row]
    from backend.agents import article_cache
    result = article_cache.get_cached("https://xinhua.net/story/123")
    assert result is not None
    assert result.url == "https://xinhua.net/story/123"
    assert result.bloc_code == "CN"


def test_put_upserts(mock_supabase):
    """put() calls upsert with the correct payload shape."""
    from backend.agents import article_cache
    article = _make_article()
    article_cache.put(article)
    upsert_call = mock_supabase.table.return_value.upsert
    assert upsert_call.called
    payload = upsert_call.call_args[0][0]
    assert "url_hash" in payload
    assert payload["url"] == article.url
    assert payload["bloc_code"] == "CN"


def test_put_with_translation(mock_supabase):
    """put() includes translated_body and translated_at when provided."""
    from backend.agents import article_cache
    article = _make_article()
    article_cache.put(article, translated_body="English translation here.")
    payload = mock_supabase.table.return_value.upsert.call_args[0][0]
    assert payload["translated_body"] == "English translation here."
    assert "translated_at" in payload


def test_get_translation_miss(mock_supabase):
    """Returns None when no translated_body in cache."""
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [{"translated_body": None}]
    from backend.agents import article_cache
    result = article_cache.get_translation("https://xinhua.net/story/123")
    assert result is None


def test_get_translation_hit(mock_supabase):
    """Returns translated_body string when present."""
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [{"translated_body": "English text."}]
    from backend.agents import article_cache
    result = article_cache.get_translation("https://xinhua.net/story/123")
    assert result == "English text."


def test_url_hash_deterministic():
    """Same URL always produces same hash."""
    from backend.agents.article_cache import _url_hash
    h1 = _url_hash("https://xinhua.net/story/123")
    h2 = _url_hash("https://xinhua.net/story/123")
    assert h1 == h2
    assert len(h1) == 64  # sha256 hex digest length


def test_functions_no_op_when_supabase_none():
    """All functions return None/nothing gracefully when supabase is None."""
    with patch("backend.agents.article_cache.supabase", None):
        from backend.agents import article_cache
        assert article_cache.get_cached("https://example.com") is None
        assert article_cache.get_translation("https://example.com") is None
        article_cache.put(_make_article())  # should not raise
        article_cache.put_translation("https://example.com", "text")  # should not raise
