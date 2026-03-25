import json
import re
import time
import requests
from collections import defaultdict
from langchain_groq import ChatGroq


NON_ENGLISH_BLOCS = {"China", "Russia", "Middle East"}

LANGUAGE_HINTS = {
    "China": "zh",
    "Russia": "ru",
    "Middle East": "ar",
}


def parse_json_response(raw: str, fallback):
    cleaned = re.sub(r"^```(?:json)?\s*", "", raw.strip(), flags=re.MULTILINE)
    cleaned = re.sub(r"\s*```$", "", cleaned.strip(), flags=re.MULTILINE)
    try:
        return json.loads(cleaned.strip())
    except json.JSONDecodeError:
        return fallback


def is_likely_non_english(text: str) -> bool:
    # If more than 15% of chars are non-ASCII, likely non-English
    if not text:
        return False
    non_ascii = sum(1 for c in text if ord(c) > 127)
    return (non_ascii / len(text)) > 0.15


def fetch_article_content(url: str, timeout: int = 8) -> str:
    try:
        headers = {"User-Agent": "Mozilla/5.0 (compatible; GroundTruth/1.0)"}
        resp = requests.get(url, headers=headers, timeout=timeout)
        resp.raise_for_status()
        return resp.text[:2000]
    except Exception:
        return ""


def translate_via_mymemory(text: str, langpair: str) -> str:
    # MyMemory free API — no key needed, 5000 chars/day
    # langpair format: "zh|en", "ru|en", "ar|en"
    try:
        text_chunk = text[:500]  # keep under limits
        resp = requests.get(
            "https://api.mymemory.translated.net/get",
            params={"q": text_chunk, "langpair": langpair},
            timeout=8,
        )
        resp.raise_for_status()
        data = resp.json()
        return data.get("responseData", {}).get("translatedText", "")
    except Exception as e:
        print(f"    [warn] MyMemory translation failed: {e}")
        return ""


def run_translation_layer(state: dict) -> dict:
    raw_research = state["raw_research"]
    topic = state["topic"]
    translation_analysis = {}

    grouped: dict = defaultdict(list)
    for item in raw_research:
        if item["region"] in NON_ENGLISH_BLOCS:
            grouped[item["region"]].append(item)

    for region, articles in grouped.items():
        lang_code = LANGUAGE_HINTS.get(region, "auto")
        langpair = f"{lang_code}|en"
        translated_samples = []

        print(f"    [translation_layer] Processing {region} ({len(articles)} articles)...")

        for article in articles[:3]:  # max 3 articles per bloc to stay within API limits
            url = article.get("url", "")
            existing_content = article.get("content", "")

            # Try to fetch actual URL content first
            fetched = fetch_article_content(url)

            # Decide which content to try translating
            content_to_translate = ""
            if fetched and is_likely_non_english(fetched):
                content_to_translate = fetched[:500]
                print(f"    [translation_layer] Found non-English content at {url[:60]}")
            elif existing_content and is_likely_non_english(existing_content):
                content_to_translate = existing_content[:500]

            if content_to_translate:
                translated = translate_via_mymemory(content_to_translate, langpair)
                if translated:
                    translated_samples.append(translated)
                time.sleep(0.5)  # be polite to free API

        # Build combined context for LLM analysis
        english_coverage = "\n".join(
            a.get("content", "")[:300] for a in articles[:3]
        )

        translated_context = "\n\n---\n\n".join(translated_samples) if translated_samples else ""

        llm = ChatGroq(model="llama-3.3-70b-versatile")
        prompt = f"""You are a linguistic analyst specializing in how different language ecosystems frame geopolitical events.

Topic: "{topic}"
Region/Bloc: {region}
Language pair analyzed: {langpair}

{"TRANSLATED CONTENT FROM ORIGINAL LANGUAGE SOURCES:" if translated_context else "NOTE: Could not retrieve non-English source text. Analyze based on known linguistic patterns of this bloc's media ecosystem."}
{translated_context or "(No direct translation available)"}

ENGLISH-LANGUAGE COVERAGE OF THIS BLOC'S PERSPECTIVE:
{english_coverage[:800]}

Analyze the linguistic and framing differences for this bloc's coverage. Focus on:

1. NAMING_CONVENTIONS: How does this language ecosystem name the key actors, places, and events?
   Compare to Western/English naming (e.g., "freedom fighters" vs "terrorists", "special military operation" vs "invasion").

2. EMPHASIS_PATTERNS: What facts, angles, or context does this bloc's coverage emphasize that English coverage downplays?

3. OMISSION_PATTERNS: What does English-language coverage typically include that this bloc's media tends to omit or minimize?

4. VOICE_PATTERNS: Does this coverage use active or passive voice to assign agency? Who is portrayed as acting vs being acted upon?

5. KEY_PHRASE_DIFFERENCES: List 3-5 specific word/phrase choices that reveal ideological framing differences.

Return ONLY valid JSON, no markdown fences:
{{
  "original_language": "{lang_code}",
  "naming_conventions": "<2-3 sentences on how key terms differ from English naming>",
  "emphasis_patterns": "<2-3 sentences on what this bloc emphasizes>",
  "omission_patterns": "<2 sentences on what this bloc omits>",
  "voice_patterns": "<1-2 sentences on agency assignment through grammar>",
  "key_phrase_differences": ["<phrase in this ecosystem>: vs English '<equivalent phrase>'", ...]
}}"""

        raw = llm.invoke(prompt).content
        result = parse_json_response(raw, {
            "original_language": lang_code,
            "naming_conventions": "[parse error]",
            "emphasis_patterns": "[parse error]",
            "omission_patterns": "[parse error]",
            "voice_patterns": "[parse error]",
            "key_phrase_differences": [],
        })
        result["translated_samples"] = translated_samples
        translation_analysis[region] = result

    return {"translation_analysis": translation_analysis}
