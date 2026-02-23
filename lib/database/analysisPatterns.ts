import { supabaseAdmin } from '@/lib/utils/supabase';

export interface AnalysisPattern {
  project_id: string;
  niche_category: string;
  category_scores: Record<string, number>;
  top_killers: string[];
  pricing_issue_flag: boolean;
  conversion_issue_flag: boolean;
}

export async function insertAnalysisPattern(
  pattern: AnalysisPattern
): Promise<void> {
  await supabaseAdmin.from('analysis_patterns').insert({
    project_id: pattern.project_id,
    niche_category: pattern.niche_category,
    category_scores: pattern.category_scores,
    top_killers: pattern.top_killers,
    pricing_issue_flag: pattern.pricing_issue_flag,
    conversion_issue_flag: pattern.conversion_issue_flag,
  });
}
