import hashlib
from datetime import datetime, timezone
from typing import Optional

from backend.db import supabase
from .extractors import Article


def _url_hash(url: str) -> str:
    return hashlib.sha256(url.encode("utf-8")).hexdigest()


def get_cached(url: str) -> Optional[Article]:
    """Return cached Article or None. Updates last_used_at on hit."""
    if not supabase:
        return None
    try:
        url_h = _url_hash(url)
        r = supabase.table("article_cache").select("*").eq("url_hash", url_h).execute()
        if not r.data:
            return None
        row = r.data[0]
        try:
            supabase.table("article_cache").update(
                {"last_used_at": datetime.now(timezone.utc).isoformat()}
            ).eq("url_hash", url_h).execute()
        except Exception:
            pass
        return Article(
            url=row["url"],
            title=row.get("title") or row["url"],
            body=row["body"],
            source_domain=row["source_domain"],
            bloc_code=row["bloc_code"],
            published=row.get("published"),
            language=row.get("language"),
        )
    except Exception:
        return None


def put(article: Article, translated_body: Optional[str] = None) -> None:
    """Upsert article into cache. Idempotent."""
    if not supabase:
        return
    try:
        payload: dict = {
            "url_hash": _url_hash(article.url),
            "url": article.url,
            "title": article.title,
            "body": article.body,
            "source_domain": article.source_domain,
            "bloc_code": article.bloc_code,
            "language": article.language,
            "published": article.published,
        }
        if translated_body is not None:
            payload["translated_body"] = translated_body
            payload["translated_at"] = datetime.now(timezone.utc).isoformat()
        supabase.table("article_cache").upsert(payload, on_conflict="url_hash").execute()
    except Exception as e:
        print(f"    [cache] put failed for {article.url}: {e}")


def get_translation(url: str) -> Optional[str]:
    """Return cached translated_body or None."""
    if not supabase:
        return None
    try:
        url_h = _url_hash(url)
        r = (
            supabase.table("article_cache")
            .select("translated_body")
            .eq("url_hash", url_h)
            .execute()
        )
        if not r.data or not r.data[0].get("translated_body"):
            return None
        return r.data[0]["translated_body"]
    except Exception:
        return None


def put_translation(url: str, translated_body: str) -> None:
    """Update translated_body for an existing cached article."""
    if not supabase:
        return
    try:
        url_h = _url_hash(url)
        supabase.table("article_cache").update(
            {
                "translated_body": translated_body,
                "translated_at": datetime.now(timezone.utc).isoformat(),
            }
        ).eq("url_hash", url_h).execute()
    except Exception as e:
        print(f"    [cache] put_translation failed for {url}: {e}")
