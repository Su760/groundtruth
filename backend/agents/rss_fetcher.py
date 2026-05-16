import asyncio

import feedparser

from .sources import BlocSources


async def get_rss_urls(
    bloc: BlocSources,
    queries: list[str],
    max_per_feed: int = 10,
) -> list[str]:
    """Pull RSS feeds for a bloc, filter entries by relevance to any of the query strings."""
    if not bloc.rss_feeds:
        return []

    topic_words: set[str] = set()
    for q in queries:
        topic_words.update(w for w in q.lower().split() if len(w) > 3)

    async def parse_one(feed_url: str) -> list[str]:
        try:
            feed = await asyncio.to_thread(feedparser.parse, feed_url)
            urls: list[str] = []
            for entry in feed.entries[: max_per_feed * 2]:
                title = (entry.get('title') or '').lower()
                summary = (entry.get('summary') or '').lower()
                if any(w in title or w in summary for w in topic_words):
                    urls.append(entry.link)
                if len(urls) >= max_per_feed:
                    break
            return urls
        except Exception:
            return []

    results = await asyncio.gather(*(parse_one(f) for f in bloc.rss_feeds))
    seen: set[str] = set()
    out: list[str] = []
    for batch in results:
        for u in batch:
            if u not in seen:
                seen.add(u)
                out.append(u)
    return out
