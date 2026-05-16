"""Smoke test — verify planner returns 8 blocs × 3 query variants.

Usage:
    python -m backend.scripts.test_planner
"""
from dotenv import load_dotenv
load_dotenv()

from backend.agents.planner import run_planner

result = run_planner({'topic': 'Taiwan strait tensions'})

print('angles:', result.get('angles'))
print()
print('bloc_queries shape:', type(result.get('bloc_queries')))

bloc_queries = result.get('bloc_queries', {})
assert len(bloc_queries) == 8, f"Expected 8 blocs, got {len(bloc_queries)}"

for code, queries in bloc_queries.items():
    print(f'\n{code}:')
    for variant, q in queries.items():
        print(f'  {variant:8s} → {q}')
    assert 'literal' in queries
    assert 'entity' in queries
    assert 'framing' in queries

print('\n✓ Smoke test passed — 8 blocs × 3 variants confirmed')
