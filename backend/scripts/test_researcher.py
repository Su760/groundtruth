"""
Smoke test for the new RSS+GDELT researcher.
Run: cd /path/to/groundtruth && python -m backend.scripts.test_researcher

Expected output:
  CN: 3-5 articles from cgtn.com / xinhuanet.com / globaltimes.cn
  RU: 3-5 articles from rt.com / tass.com / sputnikglobe.com
  ... (8 blocs total)
  TOTAL: 24-40 articles

A bloc returning 0 articles means Tavily fallback also failed — check logs.
"""
import asyncio
import sys
from pathlib import Path

# Allow running from project root
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from dotenv import load_dotenv
load_dotenv()

from backend.agents.researcher import _research_all_blocs


async def main() -> None:
    topic = sys.argv[1] if len(sys.argv) > 1 else 'Taiwan strait tensions'
    print(f'\n[smoke test] Topic: {topic!r}\n')

    results = await _research_all_blocs(topic)

    total = 0
    failures = []
    for bloc_code, articles in results.items():
        count = len(articles)
        total += count
        flag = '' if count >= 3 else ' WARNING: BELOW MINIMUM'
        print(f'  {bloc_code}: {count} articles{flag}')
        for a in articles:
            print(f'      [{a.source_domain}] {a.title[:80]}')
        if count == 0:
            failures.append(bloc_code)

    print(f'\nTOTAL: {total} articles across {len(results)} blocs')
    if failures:
        print(f'\nWARNING: Zero-article blocs (Tavily fallback also failed): {failures}')
        sys.exit(1)
    else:
        print('\nAll blocs returned at least 1 article')


asyncio.run(main())
