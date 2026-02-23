-- Beta mode: beta_leads table for email gate
-- Note: BETA_SYSTEM_USER_ID (00000000-0000-0000-0000-000000000001) must exist in auth.users
-- if projects.user_id has FK to auth.users. Create via Supabase Dashboard if needed.
CREATE TABLE IF NOT EXISTS public.beta_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  project_name TEXT NOT NULL,
  website_url TEXT,
  niche TEXT,
  initial_score INTEGER,
  percentile NUMERIC(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_beta_leads_created ON public.beta_leads(created_at);
CREATE INDEX IF NOT EXISTS idx_beta_leads_email ON public.beta_leads(email);
