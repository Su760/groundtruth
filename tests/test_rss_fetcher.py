import asyncio
from unittest.mock import patch, MagicMock
import pytest
from backend.agents.sources import BLOC_SOURCES, BlocSources
from backend.agents.rss_fetcher import get_rss_urls


def _make_feed(entries):
    feed = MagicMock()
    feed.entries = entries
    return feed


def _make_entry(title, summary, link):
    e = MagicMock()
    e.get = lambda k, d='': {'title': title, 'summary': summary}.get(k, d)
    e.link = link
    return e


@pytest.mark.asyncio
async def test_filters_by_topic_words():
    entries = [
        _make_entry('Taiwan tensions escalate', 'Military drills near strait', 'http://a.com/1'),
        _make_entry('Sports results today', 'Football match ended', 'http://a.com/2'),
        _make_entry('Taiwan strait military', 'Beijing warns Washington', 'http://a.com/3'),
    ]
    mock_feed = _make_feed(entries)
    with patch('backend.agents.rss_fetcher.feedparser') as mock_fp:
        mock_fp.parse.return_value = mock_feed
        bloc = BlocSources(
            code='CN', name='China',
            rss_feeds=['http://fake.feed/rss'],
        )
        urls = await get_rss_urls(bloc, ['Taiwan strait'], max_per_feed=10)
    assert 'http://a.com/1' in urls
    assert 'http://a.com/3' in urls
    assert 'http://a.com/2' not in urls


@pytest.mark.asyncio
async def test_matches_any_query_in_list():
    """A URL should appear if it matches ANY query in the list."""
    entries = [
        _make_entry('台湾海峡 tensions', '', 'http://cn.com/1'),
        _make_entry('one-China principle', '', 'http://cn.com/2'),
        _make_entry('Unrelated finance news', '', 'http://cn.com/3'),
    ]
    mock_feed = _make_feed(entries)
    with patch('backend.agents.rss_fetcher.feedparser') as mock_fp:
        mock_fp.parse.return_value = mock_feed
        bloc = BlocSources(code='CN', name='China', rss_feeds=['http://fake.feed/rss'])
        urls = await get_rss_urls(
            bloc,
            ['Taiwan strait', '台湾海峡', 'one-China principle'],
            max_per_feed=10,
        )
    assert 'http://cn.com/1' in urls
    assert 'http://cn.com/2' in urls
    assert 'http://cn.com/3' not in urls


@pytest.mark.asyncio
async def test_returns_empty_for_bloc_with_no_rss():
    ws = BLOC_SOURCES['WS']
    assert ws.rss_feeds == []
    urls = await get_rss_urls(ws, ['anything'])
    assert urls == []


@pytest.mark.asyncio
async def test_deduplicates_across_feeds():
    entries = [_make_entry('Taiwan crisis', '', 'http://dup.com/1')]
    mock_feed = _make_feed(entries)
    with patch('backend.agents.rss_fetcher.feedparser') as mock_fp:
        mock_fp.parse.return_value = mock_feed
        bloc = BlocSources(
            code='XX', name='Test',
            rss_feeds=['http://feed1/rss', 'http://feed2/rss'],
        )
        urls = await get_rss_urls(bloc, ['Taiwan'], max_per_feed=10)
    assert urls.count('http://dup.com/1') == 1


@pytest.mark.asyncio
async def test_handles_feed_parse_error_gracefully():
    with patch('backend.agents.rss_fetcher.feedparser') as mock_fp:
        mock_fp.parse.side_effect = Exception('connection refused')
        bloc = BlocSources(code='XX', name='Test', rss_feeds=['http://bad.feed/rss'])
        urls = await get_rss_urls(bloc, ['Taiwan'])
    assert urls == []
