-- Stores each full pipeline run
CREATE TABLE IF NOT EXISTS analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic TEXT NOT NULL,
    slug TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    confidence_score FLOAT,
    final_report TEXT
);

CREATE INDEX IF NOT EXISTS idx_analyses_slug ON analyses(slug);
CREATE INDEX IF NOT EXISTS idx_analyses_topic ON analyses(topic);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);

-- Stores per-bloc snapshot from each run
CREATE TABLE IF NOT EXISTS bloc_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
    region TEXT NOT NULL,
    narrative_frame TEXT,
    structural_interests TEXT,
    what_this_bloc_gains TEXT,
    deliberate_vs_organic TEXT,
    primary_techniques TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bloc_snapshots_analysis_id ON bloc_snapshots(analysis_id);
CREATE INDEX IF NOT EXISTS idx_bloc_snapshots_region ON bloc_snapshots(region);
