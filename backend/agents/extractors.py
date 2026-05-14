from dataclasses import dataclass
from urllib.parse import urlparse

import httpx
import trafilatura


USER_AGENT = 'GroundTruth/0.5 (research; geopolitical news analysis)'
_HEADERS = {'User-Agent': USER_AGENT, 'Accept-Language': 'en;q=0.9,*;q=0.5'}


@dataclass
class Article:
    url: str
    title: str
    body: str
    source_domain: str
    bloc_code: str
    published: str | None = None
    language: str | None = None


async def fetch_article(
    client: httpx.AsyncClient,
    url: str,
    bloc_code: str,
    timeout: float = 10.0,
) -> Article | None:
    """Fetch URL, extract body with trafilatura. Returns None on any failure."""
    from . import article_cache
    cached = article_cache.get_cached(url)
    if cached:
        return cached

    try:
        r = await client.get(url, headers=_HEADERS, timeout=timeout, follow_redirects=True)
        if r.status_code != 200 or len(r.text) < 500:
            return None
        body = trafilatura.extract(
            r.text,
            include_comments=False,
            favor_recall=True,
            output_format='txt',
            deduplicate=True,
        )
        if not body or len(body) < 300:
            return None
        meta = trafilatura.extract_metadata(r.text)
        title = (meta.title if meta and meta.title else None) or url
        domain = urlparse(url).netloc.replace('www.', '')
        article = Article(
            url=url,
            title=title,
            body=body[:8000],
            source_domain=domain,
            bloc_code=bloc_code,
            published=meta.date if meta else None,
            language=meta.language if meta else None,
        )
        article_cache.put(article)
        return article
    except Exception:
        return None
