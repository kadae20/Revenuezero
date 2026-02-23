import { supabaseAdmin } from '@/lib/utils/supabase';

export interface BetaLeadInput {
  email: string;
  project_name: string;
  website_url?: string | null;
  niche?: string | null;
  initial_score: number;
  percentile?: number | null;
}

export async function saveBetaLead(input: BetaLeadInput): Promise<void> {
  await supabaseAdmin.from('beta_leads').insert({
    email: input.email,
    project_name: input.project_name,
    website_url: input.website_url ?? null,
    niche: input.niche ?? null,
    initial_score: input.initial_score,
    percentile: input.percentile ?? null,
  });
}
