import { supabaseAdmin } from '@/lib/utils/supabase';

export interface CaseSnapshot {
  summary_text: string;
  niche?: string;
  before_score?: number;
  after_score?: number;
  improvement_area?: string;
}

export async function insertCaseSnapshot(snapshot: CaseSnapshot): Promise<void> {
  await supabaseAdmin.from('case_snapshots').insert(snapshot);
}

export async function getRecentCaseSnapshots(limit = 5): Promise<CaseSnapshot[]> {
  const { data, error } = await supabaseAdmin
    .from('case_snapshots')
    .select('summary_text, niche, before_score, after_score, improvement_area')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as CaseSnapshot[];
}
