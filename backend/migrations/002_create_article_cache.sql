-- Article-level cache keyed by sha256(url) to avoid re-fetching + re-translating
CREATE TABLE IF NOT EXISTS article_cache (
  url_hash TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT,
  body TEXT NOT NULL,
  source_domain TEXT NOT NULL,
  bloc_code TEXT NOT NULL,
  language TEXT,
  published TEXT,
  translated_body TEXT,
  translated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_article_cache_bloc ON article_cache(bloc_code);
CREATE INDEX IF NOT EXISTS idx_article_cache_used ON article_cache(last_used_at);
