import pytest
from unittest.mock import AsyncMock, MagicMock
import httpx
from backend.agents.sources import BLOC_SOURCES, BlocSources
from backend.agents.gdelt_fetcher import get_gdelt_urls, GDELT_URL


def _mock_response(urls):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {'articles': [{'url': u} for u in urls]}
    return mock_response


@pytest.mark.asyncio
async def test_returns_urls_from_gdelt_response():
    mock_client = AsyncMock()
    mock_client.get = AsyncMock(return_value=_mock_response([
        'https://reuters.com/article/1',
        'https://apnews.com/article/2',
    ]))
    urls = await get_gdelt_urls(mock_client, BLOC_SOURCES['WS'], ['Taiwan'])
    assert 'https://reuters.com/article/1' in urls
    assert 'https://apnews.com/article/2' in urls


@pytest.mark.asyncio
async def test_builds_domain_query_correctly():
    mock_client = AsyncMock()
    mock_client.get = AsyncMock(return_value=_mock_response([]))
    await get_gdelt_urls(mock_client, BLOC_SOURCES['EU'], ['Ukraine war'])
    call_kwargs = mock_client.get.call_args
    params = call_kwargs.kwargs['params']
    assert 'Ukraine war' in params['query']
    assert 'domain:bbc.com' in params['query']
    assert params['mode'] == 'artlist'
    assert params['format'] == 'json'


@pytest.mark.asyncio
async def test_runs_one_call_per_query():
    """Each query string should produce one GDELT API call."""
    mock_client = AsyncMock()
    mock_client.get = AsyncMock(return_value=_mock_response([]))
    await get_gdelt_urls(mock_client, BLOC_SOURCES['CN'], ['Taiwan strait', '台湾海峡', 'one-China principle'])
    assert mock_client.get.call_count == 3


@pytest.mark.asyncio
async def test_deduplicates_across_queries():
    """Same URL returned by two queries should appear once."""
    mock_client = AsyncMock()
    mock_client.get = AsyncMock(return_value=_mock_response(['https://xinhua.net/1']))
    urls = await get_gdelt_urls(mock_client, BLOC_SOURCES['CN'], ['Taiwan', '台湾'])
    assert urls.count('https://xinhua.net/1') == 1


@pytest.mark.asyncio
async def test_returns_empty_for_non_200():
    mock_response = MagicMock()
    mock_response.status_code = 429
    mock_client = AsyncMock()
    mock_client.get = AsyncMock(return_value=mock_response)
    urls = await get_gdelt_urls(mock_client, BLOC_SOURCES['US'], ['Taiwan'])
    assert urls == []


@pytest.mark.asyncio
async def test_returns_empty_for_bloc_with_no_domains():
    empty_bloc = BlocSources(code='XX', name='Test')
    mock_client = AsyncMock()
    urls = await get_gdelt_urls(mock_client, empty_bloc, ['anything'])
    assert urls == []
    mock_client.get.assert_not_called()


@pytest.mark.asyncio
async def test_handles_network_error_gracefully():
    mock_client = AsyncMock()
    mock_client.get = AsyncMock(side_effect=httpx.ConnectError('refused'))
    urls = await get_gdelt_urls(mock_client, BLOC_SOURCES['CN'], ['Taiwan'])
    assert urls == []
