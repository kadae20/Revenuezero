import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase';

export const dynamic = 'force-dynamic';

function isAdminAuthorized(request: NextRequest): boolean {
  const secret = request.headers.get('x-admin-secret') || request.nextUrl.searchParams.get('secret');
  return secret === process.env.ADMIN_SECRET;
}

export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [
      projectsCount,
      reportsRes,
      subscriptionsRes,
      patternsRes,
      eventsRes,
    ] = await Promise.all([
      supabaseAdmin.from('projects').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('analysis_reports').select('score, full_report_json'),
      supabaseAdmin.from('subscriptions').select('plan, status'),
      supabaseAdmin.from('analysis_patterns').select('top_killers'),
      supabaseAdmin.from('analytics_events').select('event_name'),
    ]);

    const totalProjects = projectsCount.count ?? 0;
    const reports = (reportsRes.data ?? []) as Array<{ score: number; full_report_json?: { score?: { total_score?: number } } }>;
    const subs = (subscriptionsRes.data ?? []) as Array<{ plan: string; status: string }>;
    const patterns = (patternsRes.data ?? []) as Array<{ top_killers: string[] }>;
    const events = (eventsRes.data ?? []) as Array<{ event_name: string }>;

    const avgScore =
      reports.length > 0
        ? reports.reduce((a, r) => a + (r.score ?? r.full_report_json?.score?.total_score ?? 0), 0) / reports.length
        : 0;

    const planDist: Record<string, number> = {};
    subs.forEach((s) => {
      if (s.status === 'active') {
        planDist[s.plan] = (planDist[s.plan] ?? 0) + 1;
      }
    });

    const killerCounts: Record<string, number> = {};
    patterns.forEach((p) => {
      (p.top_killers ?? []).forEach((k: string) => {
        killerCounts[k] = (killerCounts[k] ?? 0) + 1;
      });
    });
    const topKillers = Object.entries(killerCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([killer, count]) => ({ killer, count }));

    const analysisStarted = events.filter((e) => e.event_name === 'analysis_started').length;
    const checkoutClicked = events.filter((e) => e.event_name === 'checkout_clicked').length;
    const checkoutCompleted = events.filter((e) => e.event_name === 'checkout_completed').length;
    const reanalysisRate =
      reports.length > 1 ? ((reports.length - projectsCount.count) / Math.max(reports.length, 1)) * 100 : 0;

    return NextResponse.json({
      totalSaaSAnalyzed: totalProjects,
      totalReports: reports.length,
      avgScore: Math.round(avgScore * 10) / 10,
      planDistribution: planDist,
      top5CommonKillers: topKillers,
      reanalysisUsageRate: Math.round(reanalysisRate * 10) / 10,
      analytics: {
        analysis_started: analysisStarted,
        checkout_clicked: checkoutClicked,
        checkout_completed: checkoutCompleted,
      },
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
