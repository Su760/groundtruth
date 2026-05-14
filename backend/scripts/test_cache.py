"""
Cold/warm cache smoke test.
Usage: python -m backend.scripts.test_cache
Expected: cold 30-60s, warm < cold*0.5, speedup 2x+
"""
import asyncio
import time
from backend.agents.researcher import _research_all_blocs


async def main():
    topic = "Taiwan strait tensions"

    print(f"\n=== COLD RUN (topic: {topic!r}) ===")
    t0 = time.time()
    r1 = await _research_all_blocs(topic)
    cold = time.time() - t0
    cold_total = sum(len(a) for a in r1.values())
    print(f"Cold: {cold:.1f}s, {cold_total} articles across {len(r1)} blocs")
    for bloc, arts in r1.items():
        print(f"  {bloc}: {len(arts)} articles")

    print(f"\n=== WARM RUN (same topic) ===")
    t0 = time.time()
    r2 = await _research_all_blocs(topic)
    warm = time.time() - t0
    warm_total = sum(len(a) for a in r2.values())
    print(f"Warm: {warm:.1f}s, {warm_total} articles across {len(r2)} blocs")

    speedup = cold / warm if warm > 0 else float("inf")
    print(f"\nSpeedup: {speedup:.1f}x")

    assert warm < cold * 0.5, (
        f"Warm run should be at least 2x faster than cold "
        f"({cold:.1f}s -> {warm:.1f}s, got {speedup:.1f}x)"
    )
    print("PASS")


if __name__ == "__main__":
    asyncio.run(main())
