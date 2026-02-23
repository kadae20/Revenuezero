-- Production safety: idempotency + atomic usage

-- 1. Webhook event idempotency (service role only; no RLS policies for anon)
CREATE TABLE IF NOT EXISTS public.webhook_events_processed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stripe_event_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_events_stripe_id ON public.webhook_events_processed(stripe_event_id);
ALTER TABLE public.webhook_events_processed ENABLE ROW LEVEL SECURITY;
-- No policies: only service role can access (for webhook handler)

-- 2. Atomic increment RPC (prevents race condition)
-- Single UPDATE with expressions is atomic; no read-modify-write race
CREATE OR REPLACE FUNCTION increment_report_usage(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE subscriptions
  SET analyses_used_this_month = COALESCE(analyses_used_this_month, 0) + 1,
      reports_used = COALESCE(reports_used, 0) + 1,
      updated_at = NOW()
  WHERE user_id = p_user_id AND status IN ('active', 'trialing');
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_reanalysis_usage(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE subscriptions
  SET analyses_used_this_month = COALESCE(analyses_used_this_month, 0) + 1,
      reanalyses_used = COALESCE(reanalyses_used, 0) + 1,
      updated_at = NOW()
  WHERE user_id = p_user_id AND status IN ('active', 'trialing');
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_projects_count(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE subscriptions
  SET projects_count = COALESCE(projects_count, 0) + 1,
      updated_at = NOW()
  WHERE user_id = p_user_id AND status IN ('active', 'trialing');
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;
