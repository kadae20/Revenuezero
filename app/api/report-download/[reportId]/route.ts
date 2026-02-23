import { NextRequest, NextResponse } from 'next/server';
import { getReportById } from '@/lib/database/reports';
import { RevenueReport } from '@/types';

/**
 * Part 4: Downloadable report - PDF or JSON
 * No authentication required. Report must exist in DB.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  const reportId = params?.reportId;
  if (!reportId) {
    return NextResponse.json({ error: 'Report ID required' }, { status: 400 });
  }

  const analysisReport = await getReportById(reportId);
  if (!analysisReport) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  const format = _request.nextUrl.searchParams.get('format') || 'json';
  const report = analysisReport.full_report_json as RevenueReport;

  if (format === 'pdf') {
    const pdf = await generatePdf(report, analysisReport);
    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="revenuezero-report-${reportId.slice(0, 8)}.pdf"`,
      },
    });
  }

  const json = JSON.stringify(
    {
      report: report,
      reportId: analysisReport.id,
      projectId: analysisReport.project_id,
      score: analysisReport.score,
      percentile: (analysisReport as { percentile?: number | null }).percentile,
      createdAt: analysisReport.created_at,
    },
    null,
    2
  );
  return new NextResponse(json, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="revenuezero-report-${reportId.slice(0, 8)}.json"`,
    },
  });
}

async function generatePdf(
  report: RevenueReport,
  analysisReport: { score: number; created_at?: string; percentile?: number | null }
): Promise<Buffer> {
  const riskLevel = report.score?.advanced?.risk_level ?? 'Medium';
  const categoryLines = (report.score?.category_scores ?? [])
    .map((c) => `${c.category}: ${c.weighted_score}/${c.max_possible}`)
    .join('\n');
  const topKillers = (report.conversion?.conversion_killers ?? []).slice(0, 5);
  const createdAt = analysisReport.created_at
    ? new Date(analysisReport.created_at).toLocaleString()
    : new Date().toLocaleString();
  const percentile = analysisReport.percentile != null ? `Top ${Math.round(100 - analysisReport.percentile)}%` : 'N/A';

  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  let y = 20;

  doc.setFontSize(18);
  doc.text('RevenueZero Revenue Intelligence Report', 20, y);
  y += 10;
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`RevenueZero Beta • Generated ${createdAt}`, 20, y);
  y += 15;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.text('Summary', 20, y);
  y += 8;
  doc.setFontSize(11);
  doc.text(`Total Score: ${report.score?.total_score ?? 0}/100`, 20, y);
  y += 6;
  doc.text(`Percentile: ${percentile}`, 20, y);
  y += 6;
  doc.text(`Risk Level: ${riskLevel}`, 20, y);
  y += 12;

  doc.setFontSize(14);
  doc.text('Category Breakdown', 20, y);
  y += 8;
  doc.setFontSize(10);
  for (const line of categoryLines.split('\n')) {
    if (y > 270) break;
    doc.text(line, 25, y);
    y += 6;
  }
  y += 6;

  doc.setFontSize(14);
  doc.text('Top Revenue Killers', 20, y);
  y += 8;
  doc.setFontSize(10);
  for (const k of topKillers) {
    if (y > 270) break;
    doc.text(`• ${k}`, 25, y);
    y += 6;
  }
  y += 10;

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`RevenueZero Beta Verified • ${createdAt}`, 20, 285);

  return Buffer.from(doc.output('arraybuffer'));
}
