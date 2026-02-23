import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

/**
 * PART 1: Global statistics - RPC when available, else fallback
 */
export async function GET() {
  const statsRes = await supabaseAdmin.rpc('get_platform_stats').maybeSingle();
  if (statsRes.data) {
    const s = statsRes.data as { total_projects: number; total_analyses: number; avg_score: number; total_public: number };
    const [nicheRes, projRes] = await Promise.all([
      supabaseAdmin.from('analysis_reports').select('score, project_id').limit(20000),
      supabaseAdmin.from('projects').select('id, niche'),
    ]);
    const nicheMap = new Map((projRes.data ?? []).map((p: { id: string; niche: string }) => [p.id, p.niche || 'general']));
    const byNiche: Record<string, number[]> = {};
    for (const r of nicheRes.data ?? []) {
      const n = nicheMap.get(r.project_id) ?? 'general';
      if (!byNiche[n]) byNiche[n] = [];
      byNiche[n].push(r.score ?? 0);
    }
    const average_score_by_niche: Record<string, number> = {};
    for (const [n, arr] of Object.entries(byNiche)) {
      average_score_by_niche[n] = Math.round((arr.reduce((a, x) => a + x, 0) / arr.length) * 10) / 10;
    }
    return NextResponse.json({
      total_projects: s.total_projects ?? 0,
      total_analyses: s.total_analyses ?? 0,
      average_score: Number(s.avg_score ?? 0),
      average_score_by_niche,
      average_score_improvement: 0,
      total_public_projects: s.total_public ?? 0,
    });
  }

  const [
    projectsCount,
    analysesCount,
    analysesSample,
    publicCount,
  ] = await Promise.all([
    supabaseAdmin.from('projects').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('analysis_reports').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('analysis_reports').select('score, project_id').order('created_at', { ascending: false }).limit(10000),
    supabaseAdmin.from('projects').select('*', { count: 'exact', head: true }).eq('is_public', true),
  ]);

  const analysesData = { data: analysesSample.data };

  const total_projects = projectsCount.count ?? 0;
  const total_analyses = analysesCount.count ?? 0;
  const total_public_projects = publicCount.count ?? 0;

  let average_score = 0;
  if (analysesData.data?.length) {
    average_score = analysesData.data.reduce((a, r) => a + (r.score ?? 0), 0) / analysesData.data.length;
  }

  const projectIds = [...new Set((analysesData.data ?? []).map((r) => r.project_id))];
  const projectsRes = projectIds.length
    ? await supabaseAdmin.from('projects').select('id, niche').in('id', projectIds.slice(0, 5000))
    : { data: [] };
  const projectNiche = new Map((projectsRes.data ?? []).map((p) => [p.id, p.niche || 'general']));

  const nicheScores: Record<string, number[]> = {};
  for (const r of analysesData.data ?? []) {
    const n = projectNiche.get(r.project_id) ?? 'general';
    if (!nicheScores[n]) nicheScores[n] = [];
    nicheScores[n].push(r.score ?? 0);
  }
  const average_score_by_niche: Record<string, number> = {};
  for (const [n, scores] of Object.entries(nicheScores)) {
    average_score_by_niche[n] = Math.round((scores.reduce((a, s) => a + s, 0) / scores.length) * 10) / 10;
  }

  return NextResponse.json({
    total_projects,
    total_analyses,
    average_score: Math.round(average_score * 10) / 10,
    average_score_by_niche,
    average_score_improvement: 0,
    total_public_projects,
  });
}

