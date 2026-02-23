-- SaaS Intelligence OS platform expansion
-- Optimized for 100k+ projects

-- 1. analysis_reports: add percentile
ALTER TABLE public.analysis_reports
  ADD COLUMN IF NOT EXISTS percentile NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS niche TEXT;

-- 2. project_rankings (pre-aggregated for leaderboard performance)
CREATE TABLE IF NOT EXISTS public.project_rankings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  percentile NUMERIC(5,2),
  niche TEXT,
  ranking_position INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id)
);

CREATE INDEX IF NOT EXISTS idx_project_rankings_score ON public.project_rankings(score DESC);
CREATE INDEX IF NOT EXISTS idx_project_rankings_niche_score ON public.project_rankings(niche, score DESC);
CREATE INDEX IF NOT EXISTS idx_project_rankings_updated ON public.project_rankings(updated_at);

-- 3. free_analysis_attempts (extend abuse prevention)
CREATE TABLE IF NOT EXISTS public.free_analysis_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_hash TEXT NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_free_analysis_ip_created ON public.free_analysis_attempts(ip_hash, created_at);

-- 4. Indexes for performance (PART 5)
CREATE INDEX IF NOT EXISTS idx_projects_slug ON public.projects(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analysis_reports_project_id ON public.analysis_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_analysis_reports_project_created ON public.analysis_reports(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_reports_created_at ON public.analysis_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);

-- 5. Webhook: ensure unique on stripe_event_id (insert-first idempotency)
-- Already in 004; verify constraint exists
-- ALTER TABLE webhook_events_processed ADD CONSTRAINT ... if not exists

-- 6. RPC: Atomic usage with cycle reset check (PART 8)
-- Single transaction: if cycle expired AND status active, reset then increment
CREATE OR REPLACE FUNCTION try_increment_report_usage(p_user_id UUID)
RETURNS TABLE(ok BOOLEAN, analyses_used INTEGER) AS $$
DECLARE
  v_sub RECORD;
BEGIN
  SELECT * INTO v_sub FROM subscriptions
  WHERE user_id = p_user_id AND status IN ('active', 'trialing')
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0::INTEGER;
    RETURN;
  END IF;

  IF v_sub.billing_cycle_end IS NOT NULL AND v_sub.billing_cycle_end < NOW() THEN
    UPDATE subscriptions SET
      analyses_used_this_month = 0,
      billing_cycle_start = NOW(),
      billing_cycle_end = NOW() + INTERVAL '30 days',
      current_period_end = NOW() + INTERVAL '30 days',
      updated_at = NOW()
    WHERE user_id = p_user_id AND status IN ('active', 'trialing');
  END IF;

  UPDATE subscriptions SET
    analyses_used_this_month = COALESCE(analyses_used_this_month, 0) + 1,
    reports_used = COALESCE(reports_used, 0) + 1,
    updated_at = NOW()
  WHERE user_id = p_user_id AND status IN ('active', 'trialing');

  RETURN QUERY SELECT TRUE, (SELECT COALESCE(analyses_used_this_month, 0)::INTEGER FROM subscriptions WHERE user_id = p_user_id);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION try_increment_reanalysis_usage(p_user_id UUID)
RETURNS TABLE(ok BOOLEAN, analyses_used INTEGER) AS $$
DECLARE
  v_sub RECORD;
BEGIN
  SELECT * INTO v_sub FROM subscriptions
  WHERE user_id = p_user_id AND status IN ('active', 'trialing')
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0::INTEGER;
    RETURN;
  END IF;

  IF v_sub.billing_cycle_end IS NOT NULL AND v_sub.billing_cycle_end < NOW() THEN
    UPDATE subscriptions SET
      analyses_used_this_month = 0,
      billing_cycle_start = NOW(),
      billing_cycle_end = NOW() + INTERVAL '30 days',
      current_period_end = NOW() + INTERVAL '30 days',
      updated_at = NOW()
    WHERE user_id = p_user_id AND status IN ('active', 'trialing');
  END IF;

  UPDATE subscriptions SET
    analyses_used_this_month = COALESCE(analyses_used_this_month, 0) + 1,
    reanalyses_used = COALESCE(reanalyses_used, 0) + 1,
    updated_at = NOW()
  WHERE user_id = p_user_id AND status IN ('active', 'trialing');

  RETURN QUERY SELECT TRUE, (SELECT COALESCE(analyses_used_this_month, 0)::INTEGER FROM subscriptions WHERE user_id = p_user_id);
END;
$$ LANGUAGE plpgsql;

-- 7. Stats RPC for efficient aggregation
CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS TABLE(
  total_projects BIGINT,
  total_analyses BIGINT,
  avg_score NUMERIC,
  total_public BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::BIGINT FROM projects),
    (SELECT COUNT(*)::BIGINT FROM analysis_reports),
    (SELECT ROUND(AVG(score)::NUMERIC, 1) FROM analysis_reports),
    (SELECT COUNT(*)::BIGINT FROM projects WHERE is_public = true);
END;
$$ LANGUAGE plpgsql;

-- 8. Percentile RPC (uses idx_project_rankings_niche_score - no full scan)
CREATE OR REPLACE FUNCTION compute_percentile(p_score INTEGER, p_niche TEXT)
RETURNS NUMERIC AS $$
DECLARE
  v_below BIGINT;
  v_total BIGINT;
BEGIN
  SELECT COUNT(*) INTO v_total FROM project_rankings WHERE niche = p_niche;
  IF v_total <= 1 THEN RETURN NULL; END IF;
  SELECT COUNT(*) INTO v_below FROM project_rankings WHERE niche = p_niche AND score < p_score;
  RETURN ROUND((v_below::NUMERIC / v_total) * 100, 1);
END;
$$ LANGUAGE plpgsql;

-- 9. resetBillingCycle: only when status active (called from RPC above; direct call guarded)
-- Handled in app code: add WHERE status IN ('active','trialing')
