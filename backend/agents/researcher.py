import asyncio
from urllib.parse import urlparse

import httpx

from .sources import BLOC_SOURCES, BlocSources
from .extractors import fetch_article, Article
from .rss_fetcher import get_rss_urls
from .gdelt_fetcher import get_gdelt_urls


MIN_ARTICLES_PER_BLOC = 3
TARGET_ARTICLES_PER_BLOC = 5
_HTTP_LIMITS = httpx.Limits(max_connections=50, max_keepalive_connections=20)


# ---------------------------------------------------------------------------
# Old Tavily logic — preserved as private function for fallback use
# ---------------------------------------------------------------------------

_TAVILY_QUERY_MAP = {
    'CN': ("{topic} CGTN OR 'Global Times' OR Xinhua",          "China (State Media)"),
    'RU': ("{topic} RT OR TASS OR Sputnik",                     "Russia (State Media)"),
    'ME': ("{topic} Al Jazeera OR 'Middle East Eye'",            "Middle East"),
    'EU': ("{topic} BBC OR 'Deutsche Welle' OR Euronews",        "Europe"),
    'WS': ("{topic} Reuters OR 'AP News' OR AFP",                "Wire Services"),
    'US': ("{topic} CNN OR 'New York Times' OR 'Washington Post'", "US/Western"),
    'IN': ("{topic} 'The Hindu' OR NDTV OR 'Times of India'",    "India"),
    'GS': ("{topic} 'Al Jazeera English' OR Telesur OR 'Daily Maverick'", "Global South"),
}


def _tavily_search(topic: str, bloc_code: str, max_results: int = 5) -> list[dict]:
    """Original Tavily search path — returns raw Tavily result dicts."""
    query_template, _ = _TAVILY_QUERY_MAP.get(bloc_code, (f"{topic}", "Unknown"))
    query = query_template.replace("{topic}", topic)
    try:
        from langchain_tavily import TavilySearch
        tool = TavilySearch(max_results=max_results)
        result = tool.invoke({"query": query})
        # New API returns dict with 'results' key containing list of dicts
        if isinstance(result, dict) and 'results' in result:
            return result['results']
        # Fallback: handle list of dicts or list of strings
        if isinstance(result, list):
            normalized = []
            for r in result:
                if isinstance(r, dict):
                    normalized.append(r)
                elif isinstance(r, str):
                    normalized.append({'url': r, 'content': r, 'title': r})
            return normalized
        return []
    except Exception as e:
        print(f"    [warn] Tavily fallback failed for {bloc_code}: {e}")
        return []


# ---------------------------------------------------------------------------
# New primary ingestion pipeline
# ---------------------------------------------------------------------------

async def _tavily_fallback_async(
    bloc: BlocSources,
    topic: str,
    needed: int,
) -> list[Article]:
    """Run Tavily in a thread (it's sync) and convert results to Article objects."""
    raw = await asyncio.to_thread(_tavily_search, topic, bloc.code, needed + 2)
    articles: list[Article] = []
    for r in raw:
        url = r.get('url', '')
        if not url:
            continue
        domain = urlparse(url).netloc.replace('www.', '')
        body = r.get('content', '')[:8000]
        if len(body) < 50:
            continue
        articles.append(Article(
            url=url,
            title=r.get('title', '') or url,
            body=body,
            source_domain=domain,
            bloc_code=bloc.code,
        ))
    return articles[:needed]


async def _research_bloc(
    client: httpx.AsyncClient,
    bloc: BlocSources,
    topic: str,
) -> list[Article]:
    """Get articles for one bloc: RSS + GDELT primary, Tavily fallback."""
    rss_urls, gdelt_urls = await asyncio.gather(
        get_rss_urls(bloc, topic),
        get_gdelt_urls(client, bloc, topic),
    )

    seen: set[str] = set()
    candidate_urls: list[str] = []
    for u in rss_urls + gdelt_urls:
        if u and u not in seen:
            seen.add(u)
            candidate_urls.append(u)

    fetch_tasks = [
        fetch_article(client, u, bloc.code)
        for u in candidate_urls[:8]
    ]
    articles: list[Article] = [
        a for a in await asyncio.gather(*fetch_tasks) if a is not None
    ]

    if len(articles) < MIN_ARTICLES_PER_BLOC:
        needed = TARGET_ARTICLES_PER_BLOC - len(articles)
        print(f"    [researcher] {bloc.code}: only {len(articles)} articles via RSS/GDELT — Tavily fallback for {needed} more")
        fallback = await _tavily_fallback_async(bloc, topic, needed)
        articles.extend(fallback)

    print(f"    [researcher] {bloc.code} ({bloc.name}): {len(articles)} articles")
    return articles[:TARGET_ARTICLES_PER_BLOC]


async def _research_all_blocs(topic: str) -> dict[str, list[Article]]:
    """Fan out to all blocs in parallel, return {bloc_code: [Article, ...]}."""
    async with httpx.AsyncClient(limits=_HTTP_LIMITS, http2=True) as client:
        blocs = list(BLOC_SOURCES.values())
        async def _safe_research_bloc(client, bloc, topic):
            try:
                return await asyncio.wait_for(_research_bloc(client, bloc, topic), timeout=45.0)
            except asyncio.TimeoutError:
                print(f"    [researcher] {bloc.code}: timed out — skipping")
                return []
        results = await asyncio.gather(
            *[_safe_research_bloc(client, bloc, topic) for bloc in blocs]
        )
    return {bloc.code: arts for bloc, arts in zip(blocs, results)}


# ---------------------------------------------------------------------------
# Public entry point — same signature as old researcher.py
# ---------------------------------------------------------------------------

def run_researcher(state: dict) -> dict:
    """LangGraph node. Accepts state with 'topic', returns raw_research + sources."""
    topic = state['topic']
    print(f"    [researcher] Starting primary ingestion for: {topic!r}")

    articles_by_bloc = asyncio.run(_research_all_blocs(topic))

    raw_research: list[dict] = []
    sources: list[dict] = []
    seen_urls: set[str] = set()

    for bloc_code, articles in articles_by_bloc.items():
        bloc = BLOC_SOURCES[bloc_code]
        for a in articles:
            if a.url in seen_urls:
                continue
            seen_urls.add(a.url)
            raw_research.append({
                'url': a.url,
                'content': a.body[:800],
                'source_name': a.source_domain,
                'region': bloc.name,
            })
            sources.append({
                'title': a.title,
                'url': a.url,
                'agent': 'Researcher',
                'bloc': bloc_code,
                'domain': a.source_domain,
            })

    print(f"    [researcher] Collected {len(raw_research)} unique articles across {len(articles_by_bloc)} blocs")
    return {'raw_research': raw_research, 'sources': sources}
