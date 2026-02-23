import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [insightsRes, snapshotsRes] = await Promise.all([
      supabaseAdmin.from('global_insights').select('*').limit(1).single(),
      supabaseAdmin
        .from('case_snapshots')
        .select('summary_text, niche, before_score, after_score, improvement_area')
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    const insights = insightsRes.data as {
      avg_total_score?: number;
      most_common_killer?: string;
      total_analyzed?: number;
    } | null;
    const snapshots = (snapshotsRes.data ?? []) as Array<{
      summary_text: string;
      niche?: string;
      before_score?: number;
      after_score?: number;
      improvement_area?: string;
    }>;

    return NextResponse.json({
      totalAnalyzed: insights?.total_analyzed ?? 0,
      avgScore: insights?.avg_total_score ?? 0,
      mostCommonIssue: insights?.most_common_killer ?? 'Positioning clarity',
      recentSnapshots: snapshots,
    });
  } catch {
    return NextResponse.json({
      totalAnalyzed: 0,
      avgScore: 0,
      mostCommonIssue: 'Positioning clarity',
      recentSnapshots: [],
    });
  }
}
