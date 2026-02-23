import { NextRequest, NextResponse } from 'next/server';
import { getProjectBySlug } from '@/lib/database/projects';
import { supabaseAdmin } from '@/lib/utils/supabase';

export const dynamic = 'force-dynamic';

const CACHE_SECONDS = 300;

/**
 * PART 4: Shareable score badge - dynamic SVG
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { projectSlug: string } }
) {
  const slug = params?.projectSlug;
  if (!slug) {
    return new NextResponse('Not found', { status: 404 });
  }

  const project = await getProjectBySlug(slug);
  if (!project || !project.is_public) {
    return new NextResponse('Not found', { status: 404 });
  }

  const { data: ranking } = await supabaseAdmin
    .from('project_rankings')
    .select('score, percentile')
    .eq('project_id', project.id)
    .maybeSingle();

  const score = ranking?.score ?? 0;
  const percentile = ranking?.percentile ?? null;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80" viewBox="0 0 200 80">
  <rect width="200" height="80" rx="8" fill="#0f172a"/>
  <text x="20" y="35" fill="#f8fafc" font-family="system-ui,sans-serif" font-size="14" font-weight="600">RevenueZero</text>
  <text x="20" y="55" fill="#94a3b8" font-family="system-ui,sans-serif" font-size="11">Score: ${score}/100</text>
  ${percentile != null ? `<text x="110" y="55" fill="#94a3b8" font-family="system-ui,sans-serif" font-size="11">Top ${Math.round(100 - percentile)}%</text>` : ''}
  <text x="20" y="72" fill="#64748b" font-family="system-ui,sans-serif" font-size="9">RevenueZero Verified</text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': `public, max-age=${CACHE_SECONDS}, s-maxage=${CACHE_SECONDS}`,
    },
  });
}
