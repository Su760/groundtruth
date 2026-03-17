from langchain_community.tools import TavilySearchResults


SEARCH_CONFIGS = [
    ("{topic} CGTN OR \"Global Times\"",                    "CGTN/Global Times", "China"),
    ("{topic} Al Jazeera",                                  "Al Jazeera",        "Middle East"),
    ("{topic} BBC OR \"Deutsche Welle\"",                   "BBC/DW",            "Europe"),
    ("{topic} RT",                                          "RT",                "Russia"),
    ("{topic}",                                             "General",           "US/Western"),
    ("{topic} site:reuters.com OR site:apnews.com",         "Wire Services",     "Wire Services"),
]


def run_researcher(state: dict) -> dict:
    tool = TavilySearchResults(max_results=5)
    topic = state["topic"]
    seen_urls: set = set()
    raw_research = []

    for query_template, source_name, region in SEARCH_CONFIGS:
        query = query_template.replace("{topic}", topic)
        print(f"    Searching [{region}]: {query[:70]}...")
        try:
            results = tool.invoke({"query": query})
            for r in results:
                url = r.get("url", "")
                if url in seen_urls:
                    continue
                seen_urls.add(url)
                raw_research.append({
                    "url": url,
                    "content": r.get("content", "")[:800],
                    "source_name": source_name,
                    "region": region,
                })
        except Exception as e:
            print(f"    [warn] Search failed for '{source_name}': {e}")

    print(f"    Collected {len(raw_research)} unique articles")
    return {"raw_research": raw_research}
