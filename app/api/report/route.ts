import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getReportByProjectId } from '@/lib/database/reports';
import { getProjectById } from '@/lib/database/projects';
import { getSubscriptionByUserId } from '@/lib/database/subscriptions';
import { RevenueBrain } from '@/lib/orchestrator/RevenueBrain';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get('projectId');
  if (!projectId) {
    return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const project = await getProjectById(projectId, user.id);
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const reportRow = await getReportByProjectId(projectId, user.id);
  if (!reportRow) {
    return NextResponse.json({ error: 'No report found for this project' }, { status: 404 });
  }

  const subscription = await getSubscriptionByUserId(user.id);
  const hasAccess = subscription?.status === 'active';
  const fullReport = reportRow.full_report_json as Parameters<RevenueBrain['generatePreviewReport']>[0];
  const report = hasAccess ? fullReport : new RevenueBrain().generatePreviewReport(fullReport);

  return NextResponse.json({
    report,
    hasAccess: !!hasAccess,
    version: reportRow.version,
    projectId,
  });
}
