import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getProjectsByUserId } from '@/lib/database/projects';
import { getAllReportsByProjectId } from '@/lib/database/reports';
import { getSubscriptionByUserId } from '@/lib/database/subscriptions';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const projects = await getProjectsByUserId(user.id);
  const subscription = await getSubscriptionByUserId(user.id);

  const projectsWithScores = await Promise.all(
    projects.map(async (p) => {
      const reports = await getAllReportsByProjectId(p.id, user.id);
      const latest = reports[reports.length - 1];
      return {
        ...p,
        currentScore: latest?.score ?? null,
        scoreHistory: reports.map((r) => ({ version: r.version, score: r.score, created_at: r.created_at })),
      };
    })
  );

  return NextResponse.json({
    projects: projectsWithScores,
    subscription: subscription
      ? {
          plan: subscription.plan,
          analysesUsedThisMonth: subscription.analyses_used_this_month ?? 0,
          billingCycleEnd: subscription.billing_cycle_end,
          limits: subscription.plan === 'launch' || subscription.plan === 'launch_mode'
            ? { analysesPerMonth: -1, maxProjects: -1 }
            : {
                analysesPerMonth: subscription.plan === 'starter' ? 3 : 10,
                maxProjects: subscription.plan === 'starter' ? 1 : 3,
              },
        }
      : null,
  });
}
