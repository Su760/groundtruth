import asyncio
import json
import re
import requests
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from deep_translator import GoogleTranslator
from langchain_groq import ChatGroq
from backend.agents import article_cache

_TRANSLATE_POOL = ThreadPoolExecutor(max_workers=4, thread_name_prefix='translate')


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


def _translate_text(text: str, source_lang: str = 'auto') -> str:
    """Translate text to English. Returns original text on any failure."""
    if not text or len(text.strip()) < 20:
        return text
    try:
        chunk = text[:4500]
        translated = GoogleTranslator(source=source_lang, target='en').translate(chunk)
        return translated or text
    except Exception:
        return text


async def _translate_text_async(text: str, source_lang: str = 'auto', timeout: float = 8.0) -> str:
    """Async wrapper for _translate_text with hard timeout. Returns original on timeout/error."""
    if not text or len(text.strip()) < 20:
        return text
    loop = asyncio.get_event_loop()
    try:
        future = loop.run_in_executor(_TRANSLATE_POOL, _translate_text, text, source_lang)
        return await asyncio.wait_for(future, timeout=timeout)
    except (asyncio.TimeoutError, Exception):
        return text


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

        # Gather translation inputs
        to_translate: list[tuple[str, str, str]] = []  # (content, lang_code, url)
        for article in articles[:3]:
            url = article.get("url", "")
            existing_content = article.get("content", "")
            fetched = fetch_article_content(url)

            content_to_translate = ""
            if fetched and is_likely_non_english(fetched):
                content_to_translate = fetched[:500]
                print(f"    [translation_layer] Found non-English content at {url[:60]}")
            elif existing_content and is_likely_non_english(existing_content):
                content_to_translate = existing_content[:500]

            if content_to_translate:
                cached_translation = article_cache.get_translation(url) if url else None
                if cached_translation:
                    if cached_translation != content_to_translate:
                        translated_samples.append(cached_translation)
                else:
                    to_translate.append((content_to_translate, lang_code, url))

        # Run remaining translations concurrently with per-call timeout
        if to_translate:
            async def _run_translations():
                return await asyncio.gather(*[
                    _translate_text_async(content, lang, timeout=8.0)
                    for content, lang, _ in to_translate
                ])
            # Safe: run_translation_layer is a sync LangGraph node, never invoked from an async context.
            translated_results = asyncio.run(_run_translations())
            for (content, lang, url), translated in zip(to_translate, translated_results):
                if translated and translated != content:
                    if url:
                        article_cache.put_translation(url, translated)
                    translated_samples.append(translated)

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


if __name__ == '__main__':
    test = "Taiwán es una isla en el estrecho de Taiwán con tensiones crecientes."
    result = _translate_text(test, source_lang='es')
    print(f'Input:  {test}')
    print(f'Output: {result}')
    assert 'Taiwan' in result or 'island' in result.lower(), 'Translation failed'
    print('OK')
