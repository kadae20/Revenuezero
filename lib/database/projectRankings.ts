import { supabaseAdmin } from '@/lib/utils/supabase';

/**
 * PART 3: Update project_rankings - store score, niche; percentile from RPC if available
 * Returns percentile for storage in analysis_reports
 */
export async function upsertProjectRanking(
  projectId: string,
  score: number,
  niche: string | null
): Promise<{ percentile: number | null }> {
  const nicheKey = niche || 'general';
  let percentile: number | null = null;
  try {
    const { data } = await supabaseAdmin.rpc('compute_percentile', {
      p_score: score,
      p_niche: nicheKey,
    }).maybeSingle();
    if (data != null) percentile = Number(data);
  } catch {
    // RPC may not exist
  }

  await supabaseAdmin.from('project_rankings').upsert(
    {
      project_id: projectId,
      score,
      percentile,
      niche: nicheKey,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'project_id' }
  );
  return { percentile };
}
