"""Smoke test for the SemEval propaganda classifier.

First run downloads the model (~300MB) — allow 1-2 minutes.
Subsequent runs use the ~/.cache/huggingface/ cache and are instant.

Usage:
    python -m backend.scripts.test_propaganda_classifier
"""
import time

from backend.agents.propaganda_classifier import detect_techniques

samples = [
    (
        "Russia announces special military operation to protect ethnic Russians",
        "Should detect: Loaded_Language or Appeal_to_Fear",
    ),
    (
        "The president, who has lied repeatedly, claims victory",
        "Should detect: Name_Calling or Doubt",
    ),
    (
        "Either we act now or we lose everything",
        "Should detect: Black_and_White_Fallacy or Appeal_to_Fear",
    ),
    (
        "The weather is mild today and the streets are calm.",
        "Should detect: nothing (neutral text)",
    ),
]

print("Loading classifier (first call may download model — allow 1-2 min)...")
t0 = time.time()

for text, expected in samples:
    techniques = detect_techniques(text, threshold=0.3)
    print(f"\nInput:    {text}")
    print(f"Expected: {expected}")
    print(f"Detected: {techniques if techniques else '(none)'}")

elapsed = time.time() - t0
print(f"\nTotal time: {elapsed:.1f}s")
print("\nSMOKE TEST DONE — review detections above against expected labels.")
