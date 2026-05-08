import pytest
from unittest.mock import AsyncMock, MagicMock
import httpx
from backend.agents.sources import BLOC_SOURCES, BlocSources
from backend.agents.gdelt_fetcher import get_gdelt_urls, GDELT_URL


@pytest.mark.asyncio
async def test_returns_urls_from_gdelt_response():
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        'articles': [
            {'url': 'https://reuters.com/article/1'},
            {'url': 'https://apnews.com/article/2'},
        ]
    }
    mock_client = AsyncMock()
    mock_client.get = AsyncMock(return_value=mock_response)
    urls = await get_gdelt_urls(mock_client, BLOC_SOURCES['WS'], 'Taiwan')
    assert urls == ['https://reuters.com/article/1', 'https://apnews.com/article/2']


@pytest.mark.asyncio
async def test_builds_domain_query_correctly():
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {'articles': []}
    mock_client = AsyncMock()
    mock_client.get = AsyncMock(return_value=mock_response)
    await get_gdelt_urls(mock_client, BLOC_SOURCES['EU'], 'Ukraine war')
    call_kwargs = mock_client.get.call_args
    params = call_kwargs.kwargs['params']
    assert 'Ukraine war' in params['query']
    assert 'domain:bbc.com' in params['query']
    assert params['mode'] == 'artlist'
    assert params['format'] == 'json'


@pytest.mark.asyncio
async def test_returns_empty_for_non_200():
    mock_response = MagicMock()
    mock_response.status_code = 429
    mock_client = AsyncMock()
    mock_client.get = AsyncMock(return_value=mock_response)
    urls = await get_gdelt_urls(mock_client, BLOC_SOURCES['US'], 'Taiwan')
    assert urls == []


@pytest.mark.asyncio
async def test_returns_empty_for_bloc_with_no_domains():
    empty_bloc = BlocSources(code='XX', name='Test')
    mock_client = AsyncMock()
    urls = await get_gdelt_urls(mock_client, empty_bloc, 'anything')
    assert urls == []
    mock_client.get.assert_not_called()


@pytest.mark.asyncio
async def test_handles_network_error_gracefully():
    mock_client = AsyncMock()
    mock_client.get = AsyncMock(side_effect=httpx.ConnectError('refused'))
    urls = await get_gdelt_urls(mock_client, BLOC_SOURCES['CN'], 'Taiwan')
    assert urls == []
