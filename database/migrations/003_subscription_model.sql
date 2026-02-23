-- Subscription-based SaaS model migration
-- Extends existing schema; preserves backward compatibility

-- 1. Extend projects table
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS niche TEXT,
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_slug ON public.projects(slug) WHERE slug IS NOT NULL;

-- 2. Extend subscriptions table (add new columns; keep existing)
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS analyses_used_this_month INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS projects_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS billing_cycle_start TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS billing_cycle_end TIMESTAMP WITH TIME ZONE;

-- Update plan check to allow new tiers (starter/growth/launch for monthly)
-- Keep existing plan values; new subscriptions use same enum
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_plan_check
  CHECK (plan IN ('starter', 'growth', 'launch_mode', 'launch'));

-- 3. Monthly snapshots table
CREATE TABLE IF NOT EXISTS public.monthly_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  month_start DATE NOT NULL,
  score_trend JSONB,
  top_issues JSONB,
  most_improved_category TEXT,
  summary_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_monthly_snapshots_user_month ON public.monthly_snapshots(user_id, month_start);
CREATE INDEX IF NOT EXISTS idx_monthly_snapshots_project ON public.monthly_snapshots(project_id);

ALTER TABLE public.monthly_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own monthly_snapshots" ON public.monthly_snapshots FOR SELECT USING (auth.uid() = user_id);
