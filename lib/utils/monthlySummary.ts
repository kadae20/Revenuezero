/**
 * Part 6: Monthly analytics intelligence
 * Generates email-ready summary: score trend, top recurring issues, most improved category
 */

import { supabaseAdmin } from '@/lib/utils/supabase';

export interface MonthlySummary {
  score_trend: Array<{ date: string; score: number }>;
  top_issues: string[];
  most_improved_category: string | null;
  summary_text: string;
}

export async function generateMonthlySummary(
  userId: string,
  projectId: string | null,
  monthStart: Date
): Promise<MonthlySummary> {
  const monthEnd = new Date(monthStart);
  monthEnd.setMonth(monthEnd.getMonth() + 1);

  const { data: reports } = await supabaseAdmin
    .from('analysis_reports')
    .select('score, category_breakdown, full_report_json, created_at')
    .eq('user_id', userId)
    .gte('created_at', monthStart.toISOString())
    .lt('created_at', monthEnd.toISOString());

  if (!reports || reports.length === 0) {
    return {
      score_trend: [],
      top_issues: [],
      most_improved_category: null,
      summary_text: 'No analyses this month.',
    };
  }

  const sortedReports = (reports as Array<{ score: number; full_report_json?: { conversion?: { conversion_killers?: string[] } }; created_at: string }>)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const score_trend = sortedReports.map((r) => ({
    date: r.created_at.slice(0, 10),
    score: r.score,
  }));

  const allKillers: Record<string, number> = {};
  sortedReports.forEach((r) => {
    const killers = r.full_report_json?.conversion?.conversion_killers ?? [];
    killers.forEach((k) => {
      allKillers[k] = (allKillers[k] ?? 0) + 1;
    });
  });
  const top_issues = Object.entries(allKillers)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([k]) => k);

  let most_improved_category: string | null = null;
  if (sortedReports.length >= 2) {
    const first = sortedReports[0].full_report_json as { score?: { category_scores?: Array<{ category: string; weighted_score: number }> } } | undefined;
    const last = sortedReports[sortedReports.length - 1].full_report_json as typeof first;
    const firstScores = Object.fromEntries(
      (first?.score?.category_scores ?? []).map((c) => [c.category, c.weighted_score])
    );
    const lastScores = Object.fromEntries(
      (last?.score?.category_scores ?? []).map((c) => [c.category, c.weighted_score])
    );
    const deltas = Object.keys(lastScores).map((cat) => ({
      category: cat,
      delta: (lastScores[cat] ?? 0) - (firstScores[cat] ?? 0),
    }));
    const best = deltas.sort((a, b) => b.delta - a.delta)[0];
    if (best && best.delta > 0) most_improved_category = best.category;
  }

  const avgScore = score_trend.reduce((a, p) => a + p.score, 0) / score_trend.length;
  const summaryText =
    `This month: ${sortedReports.length} analysis(es), avg score ${Math.round(avgScore)}.` +
    (most_improved_category ? ` Most improved: ${most_improved_category}.` : '') +
    (top_issues.length ? ` Top issues: ${top_issues.slice(0, 3).join(', ')}.` : '');

  return {
    score_trend,
    top_issues,
    most_improved_category,
    summary_text: summaryText,
  };
}

export async function saveMonthlySnapshot(
  userId: string,
  projectId: string | null,
  monthStart: Date,
  summary: MonthlySummary
): Promise<void> {
  const monthStr = monthStart.toISOString().slice(0, 7) + '-01';
  const row = {
    user_id: userId,
    project_id: projectId,
    month_start: monthStr,
    score_trend: summary.score_trend,
    top_issues: summary.top_issues,
    most_improved_category: summary.most_improved_category,
    summary_json: summary,
  };

  const { data: existing } = await supabaseAdmin
    .from('monthly_snapshots')
    .select('id')
    .eq('user_id', userId)
    .eq('month_start', monthStr)
    .maybeSingle();

  if (existing) {
    await supabaseAdmin.from('monthly_snapshots').update(row).eq('id', existing.id);
  } else {
    await supabaseAdmin.from('monthly_snapshots').insert(row);
  }
}
