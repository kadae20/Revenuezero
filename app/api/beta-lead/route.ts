import { NextRequest, NextResponse } from 'next/server';
import { saveBetaLead } from '@/lib/database/betaLeads';
import { getReportById } from '@/lib/database/reports';
import { BETA_MODE } from '@/lib/config/featureFlags';

/**
 * Part 2: Email gate - save lead and unlock full report
 */
export async function POST(request: NextRequest) {
  if (!BETA_MODE) {
    return NextResponse.json({ error: 'Beta mode not active' }, { status: 400 });
  }

  const body = await request.json();
  const { email, project_name, website_url, niche, report_id } = body;

  if (!email || typeof email !== 'string' || !email.trim()) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }
  if (!project_name || typeof project_name !== 'string' || !project_name.trim()) {
    return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
  }
  if (!report_id || typeof report_id !== 'string') {
    return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
  }

  const report = await getReportById(report_id);
  if (!report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  const score = report.score ?? 0;
  const percentile = (report as { percentile?: number | null }).percentile ?? null;

  await saveBetaLead({
    email: email.trim(),
    project_name: project_name.trim(),
    website_url: website_url?.trim() || null,
    niche: niche?.trim() || null,
    initial_score: score,
    percentile,
  });

  const fullReport = report.full_report_json;
  return NextResponse.json({
    report: fullReport,
    reportId: report.id,
    projectId: report.project_id,
  });
}
