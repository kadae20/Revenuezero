import { supabaseAdmin } from '@/lib/utils/supabase';
import { AnalysisReport, RevenueReport } from '@/types';

export async function saveReport(
  userId: string,
  projectId: string,
  report: RevenueReport,
  version?: number
): Promise<AnalysisReport> {
  // Get next version number if not provided
  let nextVersion = version;
  if (!nextVersion) {
    const latest = await getLatestReportByProjectId(projectId, userId);
    nextVersion = latest ? latest.version + 1 : 1;
  }
  
  const categoryBreakdown: Record<string, number> = {};
  report.score.category_scores.forEach((cat) => {
    categoryBreakdown[cat.category] = cat.weighted_score;
  });
  
  const { data, error } = await supabaseAdmin
    .from('analysis_reports')
    .insert({
      user_id: userId,
      project_id: projectId,
      version: nextVersion,
      full_report_json: report as any,
      score: report.score.total_score,
      category_breakdown: categoryBreakdown,
    })
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to save report: ${error.message}`);
  }

  return data as AnalysisReport;
}

/** PART 3: Update report with percentile after ranking computed */
export async function updateReportPercentile(
  reportId: string,
  percentile: number | null,
  niche: string | null
): Promise<void> {
  await supabaseAdmin
    .from('analysis_reports')
    .update({ percentile, niche })
    .eq('id', reportId);
}

export async function getReportByProjectId(
  projectId: string,
  userId: string,
  version?: number
): Promise<AnalysisReport | null> {
  let query = supabaseAdmin
    .from('analysis_reports')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', userId);

  if (version) {
    query = query.eq('version', version);
  } else {
    query = query.order('created_at', { ascending: false }).limit(1);
  }

  const { data, error } = await query.single();

  if (error || !data) return null;
  return data as AnalysisReport;
}

/** PART 7: Latest by created_at DESC - deterministic, version-independent */
export async function getLatestReportByProjectId(
  projectId: string,
  userId: string
): Promise<AnalysisReport | null> {
  return getReportByProjectId(projectId, userId);
}

export async function getPreviousReportByProjectId(
  projectId: string,
  userId: string
): Promise<AnalysisReport | null> {
  const { data, error } = await supabaseAdmin
    .from('analysis_reports')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(2);
  if (error || !data || data.length < 2) return null;
  return data[1] as AnalysisReport;
}

/** Fetch report by ID (no auth) - for download, beta unlock */
export async function getReportById(reportId: string): Promise<AnalysisReport | null> {
  const { data, error } = await supabaseAdmin
    .from('analysis_reports')
    .select('*')
    .eq('id', reportId)
    .single();
  if (error || !data) return null;
  return data as AnalysisReport;
}

export async function getAllReportsByProjectId(
  projectId: string,
  userId: string
): Promise<AnalysisReport[]> {
  const { data, error } = await supabaseAdmin
    .from('analysis_reports')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return data as AnalysisReport[];
}

