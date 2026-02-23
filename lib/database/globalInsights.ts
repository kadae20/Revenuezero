import { supabaseAdmin } from '@/lib/utils/supabase';

export interface GlobalInsightsRow {
  id: string;
  avg_total_score: number;
  avg_niche_score: number;
  avg_positioning_score: number;
  avg_pricing_score: number;
  avg_conversion_score: number;
  avg_traffic_score: number;
  most_common_killer: string | null;
  most_common_pricing_issue: string | null;
  total_analyzed: number;
  updated_at: string;
}

export async function getGlobalInsights(): Promise<GlobalInsightsRow | null> {
  const { data, error } = await supabaseAdmin
    .from('global_insights')
    .select('*')
    .limit(1)
    .single();

  if (error || !data) return null;
  return data as GlobalInsightsRow;
}
