import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase';

export const dynamic = 'force-dynamic';

/**
 * PART 2: Leaderboard - uses project_rankings for 100k+ scale
 */
export async function GET(request: NextRequest) {
  const niche = request.nextUrl.searchParams.get('niche')?.trim() || null;
  const limit = Math.min(100, parseInt(request.nextUrl.searchParams.get('limit') || '20', 10) || 20);

  let query = supabaseAdmin
    .from('project_rankings')
    .select(`
      project_id,
      score,
      percentile,
      niche,
      ranking_position,
      updated_at,
      projects!inner(id, name, slug, is_public)
    `)
    .order('score', { ascending: false })
    .limit(limit);

  if (niche) {
    query = query.eq('niche', niche);
  }

  const { data, error } = await query;

  if (error) {
    const fallback = await supabaseAdmin
      .from('analysis_reports')
      .select('project_id, score')
      .order('created_at', { ascending: false });
    const latestByProject = new Map<string, number>();
    for (const r of fallback.data ?? []) {
      if (!latestByProject.has(r.project_id)) latestByProject.set(r.project_id, r.score);
    }
    const projIds = [...latestByProject.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([id]) => id);
    const projects = await supabaseAdmin.from('projects').select('id, name, slug, niche, is_public').in('id', projIds);
    const pm = new Map((projects.data ?? []).map((p) => [p.id, p]));
    const entries = projIds.map((id, i) => ({
      project_id: id,
      score: latestByProject.get(id),
      ranking_position: i + 1,
      project: pm.get(id),
    }));
    return NextResponse.json({ entries });
  }

  const entries = (data ?? []).map((r: { project_id: string; score: number; percentile: number; niche: string; ranking_position: number; projects: unknown }) => ({
    project_id: r.project_id,
    score: r.score,
    percentile: r.percentile,
    niche: r.niche,
    ranking_position: r.ranking_position,
    project: r.projects,
  }));

  return NextResponse.json({ entries });
}
