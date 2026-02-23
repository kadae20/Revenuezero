import { NextRequest, NextResponse } from 'next/server';
import { getProjectBySlug } from '@/lib/database/projects';
import { supabaseAdmin } from '@/lib/utils/supabase';

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SLUG_MIN_LEN = 8;
const SLUG_MAX_LEN = 80;

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug');
  if (!slug || typeof slug !== 'string') {
    return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
  }
  const trimmed = slug.trim();
  if (
    trimmed.length < SLUG_MIN_LEN ||
    trimmed.length > SLUG_MAX_LEN ||
    !SLUG_REGEX.test(trimmed)
  ) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const project = await getProjectBySlug(trimmed);
  if (!project) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (!project.is_public) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: reports } = await supabaseAdmin
    .from('analysis_reports')
    .select('score, version, created_at')
    .eq('project_id', project.id)
    .order('version', { ascending: true });

  return NextResponse.json({
    project: {
      id: project.id,
      name: project.name,
      slug: project.slug,
      niche: project.niche,
      is_public: project.is_public,
    },
    scoreHistory: (reports ?? []).map((r) => ({
      score: r.score,
      version: r.version,
      created_at: r.created_at,
    })),
  });
}
