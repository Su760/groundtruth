import asyncio

import httpx

from .sources import BlocSources


GDELT_URL = 'https://api.gdeltproject.org/api/v2/doc/doc'


async def get_gdelt_urls(
    client: httpx.AsyncClient,
    bloc: BlocSources,
    queries: list[str],
    max_records: int = 25,
) -> list[str]:
    """Query GDELT DOC 2.0 for articles from this bloc's domains for each query string."""
    if not bloc.gdelt_domains:
        return []

    domain_clause = ' OR '.join(f'domain:{d}' for d in bloc.gdelt_domains)

    async def _query_one(q: str) -> list[str]:
        query = f'({q}) ({domain_clause})'
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

    batches = await asyncio.gather(*(_query_one(q) for q in queries))
    seen: set[str] = set()
    out: list[str] = []
    for batch in batches:
        for url in batch:
            if url not in seen:
                seen.add(url)
                out.append(url)
    return out
