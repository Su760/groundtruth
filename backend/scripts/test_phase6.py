"""Phase 6 timing benchmark — validates researcher performance and junk URL filtering.

Usage:
    python -m backend.scripts.test_phase6
"""
import asyncio
import time
from dotenv import load_dotenv
load_dotenv()

from backend.agents.researcher import _research_all_blocs

_JUNK_DOMAINS = {
    'youtube.com', 'youtu.be', 'facebook.com', 'fb.com', 'm.facebook.com',
    'instagram.com', 'twitter.com', 'x.com', 'tiktok.com', 'modernghana.com',
}


async def main():
    topic = 'Taiwan strait tensions'
    bloc_queries: dict = {}
    print("=== RESEARCHER COLD RUN ===")
    t0 = time.time()
    result = await _research_all_blocs(topic, bloc_queries)
    elapsed = time.time() - t0
    total = sum(len(a) for a in result.values())
    print(f"Time: {elapsed:.1f}s, Articles: {total}")

    junk_count = 0
    for arts in result.values():
        for a in arts:
            if a.source_domain in _JUNK_DOMAINS:
                junk_count += 1
                print(f"  JUNK: {a.url}")
    print(f"Junk URLs in results: {junk_count} (expected 0)")

    assert elapsed < 90, f"Researcher should finish in under 90s, got {elapsed:.1f}s"
    assert junk_count == 0, f"Found {junk_count} junk URLs"
    print("\n✓ Phase 6 researcher gate passed")


asyncio.run(main())
