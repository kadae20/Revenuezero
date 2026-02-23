import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase';

/**
 * Part 5: Beta metrics - optimized SQL, no N+1
 */
export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function GET() {
  const [leadsRes, analysesRes, patternsRes, nicheRes] = await Promise.all([
    supabaseAdmin.from('beta_leads').select('initial_score, percentile'),
    supabaseAdmin.from('analysis_reports').select('score, percentile').limit(100000),
    supabaseAdmin.from('analysis_patterns').select('top_killers').limit(10000),
    supabaseAdmin.from('beta_leads').select('niche'),
  ]);

  const leads = (leadsRes.data ?? []) as { initial_score: number; percentile?: number | null }[];
  const analyses = (analysesRes.data ?? []) as { score: number; percentile?: number | null }[];
  const total_beta_emails = leads.length;
  const total_analyses = analyses.length;

  const avgLead = leads.length ? leads.reduce((a, l) => a + (l.initial_score ?? 0), 0) / leads.length : 0;
  const avgAnalysis = analyses.length ? analyses.reduce((a, r) => a + (r.score ?? 0), 0) / analyses.length : 0;
  const average_score = total_beta_emails > 0 ? Math.round(avgLead * 10) / 10 : Math.round(avgAnalysis * 10) / 10;

  const pctValues = leads.map((l) => l.percentile).filter((p): p is number => p != null && !Number.isNaN(p));
  const average_percentile =
    pctValues.length ? Math.round((pctValues.reduce((a, p) => a + p, 0) / pctValues.length) * 10) / 10 : null;

  const flat = (patternsRes.data ?? []).flatMap((p) => (p.top_killers ?? []) as string[]);
  const killerCounts: Record<string, number> = {};
  for (const k of flat) {
    killerCounts[k] = (killerCounts[k] ?? 0) + 1;
  }
  const most_common_killer = Object.entries(killerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const nicheCounts: Record<string, number> = {};
  for (const row of nicheRes.data ?? []) {
    const n = (row as { niche?: string | null }).niche ?? 'general';
    nicheCounts[n] = (nicheCounts[n] ?? 0) + 1;
  }
  const niche_distribution = nicheCounts;

  return NextResponse.json({
    total_beta_emails,
    total_analyses,
    average_score,
    average_percentile,
    most_common_killer,
    niche_distribution,
  });
}
