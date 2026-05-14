"""
Cache smoke test — validates article_cache read/write.

Writes an Article directly to the cache and reads it back,
confirming RLS is not blocking writes and cache round-trips work.

Usage: python -m backend.scripts.test_cache
"""
import asyncio

from backend.agents.article_cache import get_cached, put
from backend.agents.extractors import Article


async def main() -> None:
    print("\n=== Article Cache Smoke Test ===\n")

    art = Article(
        url="https://test.groundtruth.internal/cache-smoke-test",
        title="Cache Smoke Test",
        body="x" * 400,
        source_domain="test.groundtruth.internal",
        bloc_code="US",
        published=None,
        language="en",
    )

    print("Writing article to cache...")
    put(art)

    print("Reading article back from cache...")
    result = get_cached(art.url)

    assert result is not None, "put() succeeded but get_cached() returned None — check RLS"
    assert result.title == art.title, f"title mismatch: {result.title!r}"
    assert result.body == art.body, "body mismatch"
    assert result.bloc_code == art.bloc_code, f"bloc_code mismatch: {result.bloc_code!r}"

    print("PASS — cache write+read round-trip confirmed")


if __name__ == "__main__":
    asyncio.run(main())
