-- Revenue Intelligence Platform - New Tables
-- Run this migration after schema.sql

-- Analysis patterns (anonymized per-report patterns)
CREATE TABLE IF NOT EXISTS public.analysis_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  niche_category TEXT,
  category_scores JSONB,
  top_killers JSONB,
  pricing_issue_flag BOOLEAN DEFAULT FALSE,
  conversion_issue_flag BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analysis_patterns_project_id ON public.analysis_patterns(project_id);
CREATE INDEX IF NOT EXISTS idx_analysis_patterns_created_at ON public.analysis_patterns(created_at);

-- Global insights (singleton aggregate row)
CREATE TABLE IF NOT EXISTS public.global_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  avg_total_score NUMERIC(5,2) DEFAULT 0,
  avg_niche_score NUMERIC(5,2) DEFAULT 0,
  avg_positioning_score NUMERIC(5,2) DEFAULT 0,
  avg_pricing_score NUMERIC(5,2) DEFAULT 0,
  avg_conversion_score NUMERIC(5,2) DEFAULT 0,
  avg_traffic_score NUMERIC(5,2) DEFAULT 0,
  most_common_killer TEXT,
  most_common_pricing_issue TEXT,
  total_analyzed INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Case snapshots (anonymized success summaries for social proof)
CREATE TABLE IF NOT EXISTS public.case_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  summary_text TEXT NOT NULL,
  niche TEXT,
  before_score INTEGER,
  after_score INTEGER,
  improvement_area TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_snapshots_created_at ON public.case_snapshots(created_at);

-- Analytics events
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_name TEXT NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);

-- Rate limit attempts (per-IP for free previews)
CREATE TABLE IF NOT EXISTS public.rate_limit_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_hash TEXT NOT NULL,
  attempt_count INTEGER DEFAULT 0,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limit_ip_hash ON public.rate_limit_attempts(ip_hash);

-- RLS for new tables (admin/service role only for aggregates)
ALTER TABLE public.analysis_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_attempts ENABLE ROW LEVEL SECURITY;

-- Service role can do everything; anon/authenticated read global_insights and case_snapshots for landing
CREATE POLICY "Anyone can read global_insights" ON public.global_insights FOR SELECT USING (true);
CREATE POLICY "Anyone can read case_snapshots" ON public.case_snapshots FOR SELECT USING (true);
