"""Smoke test for the SemEval propaganda classifier (Groq LLM backend).

Usage:
    python -m backend.scripts.test_propaganda_classifier
"""
from dotenv import load_dotenv
load_dotenv()

from backend.agents.propaganda_classifier import detect_techniques, detect_techniques_batch

samples = [
    "Russia announces special military operation to protect ethnic Russians",
    "The president, who has lied repeatedly, claims victory",
    "Either we act now or we lose everything",
    "The weather is mild today and the streets are calm.",
]

print("=== Single-call API ===")
for s in samples:
    print(f"\n{s}")
    print(f"  → {detect_techniques(s, threshold=0.4)}")

print("\n=== Batched API ===")
batched = detect_techniques_batch(samples, threshold=0.4)
for s, t in zip(samples, batched):
    print(f"\n{s}")
    print(f"  → {t}")

print("\nSMOKE TEST DONE")
