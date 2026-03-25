import json
import re
import requests
from datetime import datetime, timedelta, timezone
from langchain_groq import ChatGroq


def parse_json_response(raw: str, fallback):
    cleaned = re.sub(r"^```(?:json)?\s*", "", raw.strip(), flags=re.MULTILINE)
    cleaned = re.sub(r"\s*```$", "", cleaned.strip(), flags=re.MULTILINE)
    try:
        return json.loads(cleaned.strip())
    except json.JSONDecodeError:
        return fallback


FALLBACK = {
    "timeline": [],
    "root_causes": "",
    "why_it_matters_now": "",
    "key_players_history": "",
}


def run_context_historian(state: dict) -> dict:
    topic = state["topic"]
    now = datetime.now(tz=timezone.utc)
    start = (now - timedelta(days=3 * 365)).strftime("%Y%m%d%H%M%S")
    end = (now - timedelta(days=180)).strftime("%Y%m%d%H%M%S")

    articles = []
    try:
        resp = requests.get(
            "https://api.gdeltproject.org/api/v2/doc/doc",
            params={
                "query": topic,
                "mode": "ArtList",
                "maxrecords": 20,
                "format": "json",
                "startdatetime": start,
                "enddatetime": end,
            },
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        for art in (data.get("articles") or []):
            title = art.get("title", "").strip()
            seendate = art.get("seendate", "")
            url = art.get("url", "")
            if title:
                articles.append({"title": title, "date": seendate, "url": url})
        print(f"    Retrieved {len(articles)} historical articles from GDELT")
    except Exception as e:
        print(f"    [warn] GDELT fetch failed: {e}. Proceeding with LLM-only mode.")

    article_list = "\n".join(
        f"- [{a['date'][:8]}] {a['title']}"
        for a in articles[:20]
    ) or "(No historical articles retrieved — synthesize from general knowledge)"

    llm = ChatGroq(model="llama-3.3-70b-versatile")
    prompt = f"""You are a historian and analyst. Based on the topic and historical article headlines below,
synthesize a structured historical context for "{topic}".

Historical article headlines (from 6 months to 3 years ago):
{article_list}

Return ONLY valid JSON in this exact structure (no markdown fences, no extra keys):
{{
  "timeline": ["<YYYY: key event>", "<YYYY: key event>", ...],
  "root_causes": "<2-3 sentences on the deep structural causes of this issue>",
  "why_it_matters_now": "<2 sentences connecting historical patterns to the current situation>",
  "key_players_history": "<2-3 sentences on who has historically been involved and their long-term interests>"
}}

Include 5-8 events in the timeline. Base all content on verifiable historical facts."""

    raw = llm.invoke(prompt).content
    historical_context = parse_json_response(raw, FALLBACK)

    return {"historical_context": historical_context}
