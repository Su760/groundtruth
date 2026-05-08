import httpx

from .sources import BlocSources


GDELT_URL = 'https://api.gdeltproject.org/api/v2/doc/doc'


async def get_gdelt_urls(
    client: httpx.AsyncClient,
    bloc: BlocSources,
    topic: str,
    max_records: int = 25,
) -> list[str]:
    """Query GDELT DOC 2.0 for articles from this bloc's domains on this topic."""
    if not bloc.gdelt_domains:
        return []

    domain_clause = ' OR '.join(f'domain:{d}' for d in bloc.gdelt_domains)
    query = f'({topic}) ({domain_clause})'

    params = {
        'query': query,
        'mode': 'artlist',
        'format': 'json',
        'maxrecords': max_records,
        'sort': 'datedesc',
    }

    try:
        r = await client.get(GDELT_URL, params=params, timeout=15.0)
        if r.status_code != 200:
            return []
        data = r.json()
        return [a['url'] for a in data.get('articles', []) if a.get('url')]
    except Exception:
        return []
