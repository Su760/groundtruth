import json
from functools import lru_cache
from langchain_groq import ChatGroq

SEMEVAL_TECHNIQUES = [
    "Appeal_to_Authority", "Appeal_to_Fear", "Appeal_to_Popularity",
    "Appeal_to_Values", "Causal_Oversimplification", "Conversation_Killer",
    "Doubt", "Exaggeration_or_Minimisation", "Flag_Waving",
    "Guilt_by_Association", "Loaded_Language", "Name_Calling_or_Labeling",
    "Obfuscation_or_Vagueness", "Questioning_the_Reputation",
    "Red_Herring", "Repetition", "Slogans",
    "Straw_Man", "Whataboutism", "Black_and_White_Fallacy",
    "False_Dilemma", "Appeal_to_Hypocrisy", "Thought_Terminating_Cliche",
]

_TECHNIQUE_LIST = "\n".join(f"- {t}" for t in SEMEVAL_TECHNIQUES)

_PROMPT_TEMPLATE = """You are a propaganda technique classifier using the SemEval-2023 Task 3 taxonomy.

Analyze this text for propaganda techniques. Return ONLY a JSON array.
Each item must have: {{"technique": "<name>", "score": <0.0-1.0>}}
Only include techniques with score >= 0.4.
If no techniques are present, return [].

Valid techniques:
{techniques}

Text to analyze:
{text}

JSON array only, no other text:"""


@lru_cache(maxsize=1)
def _get_llm():
    return ChatGroq(model="llama-3.3-70b-versatile", temperature=0)


def detect_techniques(text: str, threshold: float = 0.5) -> list[dict]:
    """
    Classify propaganda techniques using SemEval-2023 taxonomy via Groq LLM.
    temperature=0 makes output deterministic — same input → same output.
    Returns [{'technique': str, 'score': float}] for labels above threshold.
    """
    if not text or len(text.strip()) < 50:
        return []
    try:
        llm = _get_llm()
        prompt = _PROMPT_TEMPLATE.format(
            techniques=_TECHNIQUE_LIST,
            text=text[:1500],
        )
        response = llm.invoke(prompt).content.strip()
        # Strip markdown code blocks if present
        if response.startswith("```"):
            response = response.split("```")[1]
            if response.startswith("json"):
                response = response[4:]
        results = json.loads(response)
        return [
            {"technique": r["technique"], "score": float(r["score"])}
            for r in results
            if isinstance(r, dict)
            and r.get("technique") in SEMEVAL_TECHNIQUES
            and float(r.get("score", 0)) >= threshold
        ]
    except Exception as e:
        print(f"    [propaganda_classifier] failed: {e}")
        return []
