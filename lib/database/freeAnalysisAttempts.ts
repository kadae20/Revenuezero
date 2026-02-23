import { supabaseAdmin } from '@/lib/utils/supabase';

/**
 * PART 6: Record free analysis attempt for abuse prevention / audit
 */
export async function recordFreeAnalysisAttempt(
  ipHash: string,
  projectId?: string | null
): Promise<void> {
  await supabaseAdmin.from('free_analysis_attempts').insert({
    ip_hash: ipHash,
    project_id: projectId ?? null,
  });
}
