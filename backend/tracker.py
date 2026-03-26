import re
from backend.db import get_db


def topic_to_slug(topic: str) -> str:
    """Convert topic to URL-safe slug."""
    slug = topic.lower().strip()
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"\s+", "-", slug)
    slug = re.sub(r"-+", "-", slug)
    return slug[:80]


def save_analysis(accumulated: dict) -> str | None:
    """
    Save a completed pipeline run to Supabase.
    Returns the analysis UUID on success, None on failure.
    Called after the SSE done event is queued so the user sees the report immediately.
    """
    try:
        db = get_db()
        topic = accumulated.get("topic", "")
        slug = topic_to_slug(topic)

        # Insert analysis row
        analysis_result = db.table("analyses").insert({
            "topic": topic,
            "slug": slug,
            "confidence_score": accumulated.get("confidence_score"),
            "final_report": accumulated.get("final_report", ""),
        }).execute()

        analysis_id = analysis_result.data[0]["id"]

        # Insert bloc snapshots from perspective_analysis
        perspective_analysis = accumulated.get("perspective_analysis", {})
        propaganda_report = accumulated.get("propaganda_report", [])

        # Build lookup: source_name → primary_techniques
        propaganda_by_source = {}
        for p in propaganda_report:
            source = p.get("source_name", "")
            propaganda_by_source[source] = p.get("primary_techniques", [])

        snapshots = []
        for region, data in perspective_analysis.items():
            # Fuzzy-match source name to find propaganda techniques
            techniques = []
            for source_key, techs in propaganda_by_source.items():
                if region.lower() in source_key.lower() or source_key.lower() in region.lower():
                    techniques = techs
                    break

            snapshots.append({
                "analysis_id": analysis_id,
                "region": region,
                "narrative_frame": data.get("narrative_frame", ""),
                "structural_interests": data.get("structural_interests", ""),
                "what_this_bloc_gains": data.get("what_this_bloc_gains", ""),
                "deliberate_vs_organic": data.get("deliberate_vs_organic", ""),
                "primary_techniques": techniques,
            })

        if snapshots:
            db.table("bloc_snapshots").insert(snapshots).execute()

        print(f"    [tracker] Saved analysis {analysis_id} for topic: {topic}")
        return analysis_id

    except Exception as e:
        print(f"    [tracker] Save failed (non-critical): {e}")
        return None


def get_tracked_topics() -> list[dict]:
    """
    Returns list of topics with run count and last run date.
    Groups by slug, ordered by most recent run.
    """
    try:
        db = get_db()
        result = db.table("analyses") \
            .select("slug, topic, created_at") \
            .order("created_at", desc=True) \
            .execute()

        # Group by slug in Python
        seen: dict[str, dict] = {}
        for row in result.data:
            slug = row["slug"]
            if slug not in seen:
                seen[slug] = {
                    "slug": slug,
                    "topic": row["topic"],
                    "last_run": row["created_at"],
                    "run_count": 1,
                }
            else:
                seen[slug]["run_count"] += 1

        return list(seen.values())

    except Exception as e:
        print(f"    [tracker] get_tracked_topics failed: {e}")
        return []


def get_topic_history(slug: str) -> list[dict]:
    """
    Returns all runs for a slug, oldest first.
    Each run includes its bloc_snapshots.
    """
    try:
        db = get_db()

        analyses = db.table("analyses") \
            .select("id, topic, created_at, confidence_score") \
            .eq("slug", slug) \
            .order("created_at", desc=False) \
            .execute()

        if not analyses.data:
            return []

        analysis_ids = [a["id"] for a in analyses.data]
        snapshots = db.table("bloc_snapshots") \
            .select("*") \
            .in_("analysis_id", analysis_ids) \
            .execute()

        # Group snapshots by analysis_id
        snaps_by_analysis: dict[str, list] = {}
        for snap in snapshots.data:
            aid = snap["analysis_id"]
            snaps_by_analysis.setdefault(aid, []).append(snap)

        return [
            {**analysis, "bloc_snapshots": snaps_by_analysis.get(analysis["id"], [])}
            for analysis in analyses.data
        ]

    except Exception as e:
        print(f"    [tracker] get_topic_history failed: {e}")
        return []


def get_run_count_for_topic(slug: str) -> int:
    """Quick count of how many times a topic has been analyzed."""
    try:
        db = get_db()
        result = db.table("analyses") \
            .select("id", count="exact") \
            .eq("slug", slug) \
            .execute()
        return result.count or 0
    except Exception:
        return 0
