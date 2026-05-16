import asyncio
import os


def _get_exa():
    api_key = os.environ.get('EXA_API_KEY')
    if not api_key:
        return None
    try:
        from exa_py import Exa
        return Exa(api_key=api_key)
    except ImportError:
        print("    [exa] exa-py not installed — skipping Exa")
        return None


async def exa_search(
    query: str,
    num_results: int = 5,
    include_domains: list[str] | None = None,
) -> list[dict]:
    """Search Exa and return [{url, title, content}]. Returns [] if no key or on error."""
    exa = _get_exa()
    if not exa:
        return []
    try:
        results = await asyncio.to_thread(
            exa.search_and_contents,
            query,
            num_results=num_results,
            include_domains=include_domains or [],
            type='neural',
        )
        return [
            {
                'url': r.url,
                'title': r.title or r.url,
                'content': r.text or '',
            }
            for r in results.results
            if r.url
        ]
    except Exception as e:
        print(f"    [exa] search failed: {e}")
        return []
