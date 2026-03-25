from langchain_community.tools import TavilySearchResults


SEARCH_CONFIGS = [
    ("{topic} CGTN OR 'Global Times' OR Xinhua",                    "China (State Media)", "China"),
    ("{topic} RT OR TASS OR Sputnik",                               "Russia (State Media)", "Russia"),
    ("{topic} Al Jazeera OR 'Middle East Eye'",                     "Middle East",          "Middle East"),
    ("{topic} BBC OR 'Deutsche Welle' OR Euronews",                 "Europe",               "Europe"),
    ("{topic} Reuters OR 'AP News' OR AFP",                         "Wire Services",        "Wire Services"),
    ("{topic} CNN OR 'New York Times' OR 'Washington Post'",        "US/Western",           "US/Western"),
    ("{topic} 'The Hindu' OR NDTV OR 'Times of India'",             "India",                "India"),
    ("{topic} 'Al Jazeera English' OR Telesur OR 'Daily Maverick'", "Global South",         "Global South"),
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
