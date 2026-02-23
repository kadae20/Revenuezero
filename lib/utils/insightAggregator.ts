/**
 * Insight Aggregator - Updates global metrics from report patterns
 * Called on each FULL report completion
 */

import { RevenueReport } from '@/types';
import { insertAnalysisPattern } from '@/lib/database/analysisPatterns';
import { getGlobalInsights } from '@/lib/database/globalInsights';
import { supabaseAdmin } from '@/lib/utils/supabase';
import { insertCaseSnapshot } from '@/lib/database/caseSnapshots';

export interface PatternForAggregation {
  project_id: string;
  niche_category: string;
  category_scores: Record<string, number>;
  top_killers: string[];
  pricing_issue_flag: boolean;
  conversion_issue_flag: boolean;
}

export function extractPatternFromReport(
  report: RevenueReport,
  projectId: string
): PatternForAggregation {
  const categoryScores: Record<string, number> = {};
  report.score.category_scores.forEach((c) => {
    categoryScores[c.category] = c.weighted_score;
  });
  const niche =
    report.score.category_scores.find((c) => c.category === 'Niche Clarity')
      ?.breakdown?.market_narrowness != null
      ? 'identified'
      : 'general';
  const pricingIssue =
    (categoryScores['Pricing Fit'] ?? 15) < 8;
  const conversionIssue =
    (categoryScores['Conversion Strength'] ?? 20) < 10;

  return {
    project_id: projectId,
    niche_category: niche,
    category_scores: categoryScores,
    top_killers: report.conversion.conversion_killers?.slice(0, 5) ?? [],
    pricing_issue_flag: pricingIssue,
    conversion_issue_flag: conversionIssue,
  };
}

export async function aggregateInsights(
  report: RevenueReport,
  projectId: string,
  previousScore?: number | null
): Promise<void> {
  const pattern = extractPatternFromReport(report, projectId);

  await insertAnalysisPattern(pattern);

  const existing = await getGlobalInsights();
  const n = (existing?.total_analyzed ?? 0) + 1;
  const prev = existing ?? ({} as Record<string, number>);

  const lerp = (prevVal: number, newVal: number) =>
    Math.round(((prevVal || 0) * (n - 1) + newVal) / n * 100) / 100;

  const niche = pattern.category_scores['Niche Clarity'] ?? 0;
  const positioning = pattern.category_scores['Positioning Strength'] ?? 0;
  const pricing = pattern.category_scores['Pricing Fit'] ?? 0;
  const conversion = pattern.category_scores['Conversion Strength'] ?? 0;
  const traffic = pattern.category_scores['Traffic Clarity'] ?? 0;

  const updates = {
    avg_total_score: lerp(Number(prev.avg_total_score), report.score.total_score),
    avg_niche_score: lerp(Number(prev.avg_niche_score), niche),
    avg_positioning_score: lerp(Number(prev.avg_positioning_score), positioning),
    avg_pricing_score: lerp(Number(prev.avg_pricing_score), pricing),
    avg_conversion_score: lerp(Number(prev.avg_conversion_score), conversion),
    avg_traffic_score: lerp(Number(prev.avg_traffic_score), traffic),
    total_analyzed: n,
    updated_at: new Date().toISOString(),
  };

  const id = existing?.id;
  if (id) {
    await supabaseAdmin
      .from('global_insights')
      .update({
        ...updates,
        most_common_killer: pattern.top_killers[0] ?? existing?.most_common_killer ?? null,
      })
      .eq('id', id);
  } else {
    await supabaseAdmin.from('global_insights').insert({
      ...updates,
      most_common_killer: pattern.top_killers[0] ?? null,
    });
  }

  const worstCat = [...report.score.category_scores].sort(
    (a, b) => a.weighted_score - b.weighted_score
  )[0];
  const summary =
    previousScore != null
      ? `SaaS in ${pattern.niche_category} improved from ${previousScore} → ${report.score.total_score} after fixing ${worstCat?.category ?? 'positioning'}.`
      : `SaaS in ${pattern.niche_category} scored ${report.score.total_score}. Top priority: ${worstCat?.category ?? 'positioning'}.`;

  await insertCaseSnapshot({
    summary_text: summary,
    niche: pattern.niche_category,
    before_score: previousScore ?? undefined,
    after_score: report.score.total_score,
    improvement_area: worstCat?.category,
  });
}
