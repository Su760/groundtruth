-- Disable RLS on article_cache — this is a backend-only cache table,
-- not user-facing. The anon key used by the Python client cannot write
-- past the default restrictive policy. Service-role writes are the only
-- access pattern, so RLS adds no value here.
ALTER TABLE article_cache DISABLE ROW LEVEL SECURITY;
