import asyncio
import os
from urllib.parse import urlparse

import httpx

from .sources import BLOC_SOURCES, BlocSources
from .extractors import fetch_article, Article
from .rss_fetcher import get_rss_urls
from .gdelt_fetcher import get_gdelt_urls
from .exa_fetcher import exa_search


MIN_ARTICLES_PER_BLOC = 3
TARGET_ARTICLES_PER_BLOC = 5
_HTTP_LIMITS = httpx.Limits(max_connections=50, max_keepalive_connections=20)

RSS_GDELT_TIMEOUT = 20.0
FETCH_TIMEOUT = 20.0
FALLBACK_TIMEOUT = 15.0
BLOC_TOTAL_BUDGET = 50.0


# ---------------------------------------------------------------------------
# Tavily fallback — preserved as private helper
# ---------------------------------------------------------------------------

_TAVILY_QUERY_MAP = {
    'CN': ("{query} CGTN OR 'Global Times' OR Xinhua",          "China (State Media)"),
    'RU': ("{query} RT OR TASS OR Sputnik",                     "Russia (State Media)"),
    'ME': ("{query} Al Jazeera OR 'Middle East Eye'",            "Middle East"),
    'EU': ("{query} BBC OR 'Deutsche Welle' OR Euronews",        "Europe"),
    'WS': ("{query} Reuters OR 'AP News' OR AFP",                "Wire Services"),
    'US': ("{query} CNN OR 'New York Times' OR 'Washington Post'", "US/Western"),
    'IN': ("{query} 'The Hindu' OR NDTV OR 'Times of India'",    "India"),
    'GS': ("{query} 'Al Jazeera English' OR Telesur OR 'Daily Maverick'", "Global South"),
}


def _tavily_search(query: str, bloc_code: str, max_results: int = 5) -> list[dict]:
    query_template, _ = _TAVILY_QUERY_MAP.get(bloc_code, (f"{query}", "Unknown"))
    built_query = query_template.replace("{query}", query)
    try:
        from langchain_tavily import TavilySearch
        tool = TavilySearch(max_results=max_results)
        result = tool.invoke({"query": built_query})
        if isinstance(result, dict) and 'results' in result:
            return result['results']
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


async def _tavily_fallback_async(
    bloc: BlocSources,
    query: str,
    needed: int,
) -> list[Article]:
    raw = await asyncio.to_thread(_tavily_search, query, bloc.code, needed + 2)
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


# ---------------------------------------------------------------------------
# Exa-first fallback with Tavily secondary
# ---------------------------------------------------------------------------

async def _exa_or_tavily_fallback(
    bloc: BlocSources,
    queries: list[str],
    needed: int,
) -> list[Article]:
    """Try Exa first if EXA_API_KEY is configured; fall back to Tavily."""
    framing_query = queries[-1] if queries else ''
    literal_query = queries[0] if queries else ''

    if os.environ.get('EXA_API_KEY'):
        exa_results = await exa_search(
            framing_query,
            num_results=needed + 2,
            include_domains=bloc.gdelt_domains,
        )
        if not exa_results:
            exa_results = await exa_search(
                literal_query,
                num_results=needed + 2,
                include_domains=bloc.gdelt_domains,
            )

        articles: list[Article] = []
        for r in exa_results:
            content = r.get('content', '')
            if len(content) < 200:
                continue
            domain = urlparse(r['url']).netloc.replace('www.', '')
            articles.append(Article(
                url=r['url'],
                title=r.get('title', '') or r['url'],
                body=content[:8000],
                source_domain=domain,
                bloc_code=bloc.code,
            ))
            if len(articles) >= needed:
                break
        if articles:
            print(f"    [researcher] {bloc.code}: Exa returned {len(articles)} articles")
            return articles

    return await _tavily_fallback_async(bloc, literal_query, needed)


# ---------------------------------------------------------------------------
# Primary ingestion pipeline
# ---------------------------------------------------------------------------

async def _research_bloc(
    client: httpx.AsyncClient,
    bloc: BlocSources,
    queries: list[str],
) -> list[Article]:
    """Get articles for one bloc: RSS + GDELT primary, Exa/Tavily fallback."""
    try:
        rss_urls, gdelt_urls = await asyncio.wait_for(
            asyncio.gather(
                get_rss_urls(bloc, queries),
                get_gdelt_urls(client, bloc, queries),
            ),
            timeout=RSS_GDELT_TIMEOUT,
        )
    except asyncio.TimeoutError:
        print(f"    [researcher] {bloc.code}: RSS/GDELT timed out — using empty URL list")
        rss_urls, gdelt_urls = [], []

    max_candidates = TARGET_ARTICLES_PER_BLOC * 2
    seen: set[str] = set()
    candidate_urls: list[str] = []
    for u in rss_urls + gdelt_urls:
        if u and u not in seen:
            seen.add(u)
            candidate_urls.append(u)
            if len(candidate_urls) >= max_candidates:
                break

    fetch_tasks = [
        fetch_article(client, u, bloc.code)
        for u in candidate_urls[:8]
    ]
    try:
        fetched = await asyncio.wait_for(
            asyncio.gather(*fetch_tasks),
            timeout=FETCH_TIMEOUT,
        )
        articles: list[Article] = [a for a in fetched if a is not None]
    except asyncio.TimeoutError:
        print(f"    [researcher] {bloc.code}: fetch phase timed out — continuing with 0 articles")
        articles = []

    if len(articles) < MIN_ARTICLES_PER_BLOC:
        needed = TARGET_ARTICLES_PER_BLOC - len(articles)
        print(f"    [researcher] {bloc.code}: only {len(articles)} articles via RSS/GDELT — fallback for {needed} more")
        try:
            fallback = await asyncio.wait_for(
                _exa_or_tavily_fallback(bloc, queries, needed),
                timeout=FALLBACK_TIMEOUT,
            )
            articles.extend(fallback)
        except asyncio.TimeoutError:
            print(f"    [researcher] {bloc.code}: fallback timed out")

    print(f"    [researcher] {bloc.code} ({bloc.name}): {len(articles)} articles")
    return articles[:TARGET_ARTICLES_PER_BLOC]


async def _research_all_blocs(
    topic: str,
    bloc_queries: dict,
) -> dict[str, list[Article]]:
    """Fan out to all blocs in parallel, return {bloc_code: [Article, ...]}."""
    async with httpx.AsyncClient(limits=_HTTP_LIMITS, http2=False) as client:
        blocs = list(BLOC_SOURCES.values())

        async def _safe_research_bloc(client, bloc):
            bq = bloc_queries.get(bloc.code, {})
            queries = list(dict.fromkeys([
                bq.get('literal', topic),
                bq.get('entity', topic),
                bq.get('framing', topic),
            ]))
            try:
                return await asyncio.wait_for(
                    _research_bloc(client, bloc, queries),
                    timeout=BLOC_TOTAL_BUDGET,
                )
            except asyncio.TimeoutError:
                print(f"    [researcher] {bloc.code}: bloc total budget exceeded — skipping")
                return []

        results = await asyncio.gather(
            *[_safe_research_bloc(client, bloc) for bloc in blocs]
        )
    return {bloc.code: arts for bloc, arts in zip(blocs, results)}


# ---------------------------------------------------------------------------
# Public entry point — same signature as Phase 4
# ---------------------------------------------------------------------------

def run_researcher(state: dict) -> dict:
    """LangGraph node. Accepts state with 'topic' + optional 'bloc_queries'."""
    topic = state['topic']
    bloc_queries = state.get('bloc_queries') or {}
    print(f"    [researcher] Starting primary ingestion for: {topic!r}")
    if bloc_queries:
        print(f"    [researcher] Using per-bloc query variants from Planner")
    else:
        print(f"    [researcher] No bloc_queries in state — using topic string for all blocs")

    articles_by_bloc = asyncio.run(_research_all_blocs(topic, bloc_queries))

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
