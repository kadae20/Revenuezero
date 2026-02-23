import { NextRequest, NextResponse } from 'next/server';
import { getReportById } from '@/lib/database/reports';

/** Badge by report ID - no is_public check (for beta/shared reports) */
export const dynamic = 'force-dynamic';
const CACHE_SECONDS = 300;

export async function GET(
  _request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  const reportId = params?.reportId;
  if (!reportId) return new NextResponse('Not found', { status: 404 });

  const report = await getReportById(reportId);
  if (!report) return new NextResponse('Not found', { status: 404 });

  const score = report.score ?? 0;
  const percentile = (report as { percentile?: number | null }).percentile ?? null;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80" viewBox="0 0 200 80">
  <rect width="200" height="80" rx="8" fill="#0f172a"/>
  <text x="20" y="35" fill="#f8fafc" font-family="system-ui,sans-serif" font-size="14" font-weight="600">RevenueZero</text>
  <text x="20" y="55" fill="#94a3b8" font-family="system-ui,sans-serif" font-size="11">Score: ${score}/100</text>
  ${percentile != null ? `<text x="110" y="55" fill="#94a3b8" font-family="system-ui,sans-serif" font-size="11">Top ${Math.round(100 - percentile)}%</text>` : ''}
  <text x="20" y="72" fill="#64748b" font-family="system-ui,sans-serif" font-size="9">RevenueZero Beta Verified</text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': `public, max-age=${CACHE_SECONDS}, s-maxage=${CACHE_SECONDS}`,
    },
  });
}
