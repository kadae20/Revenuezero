import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { updateProject, getProjectById } from '@/lib/database/projects';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  _request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const authHeader = _request.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = authHeader.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const project = await getProjectById(params.projectId, user.id);
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(project);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = authHeader.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const projectId = params.projectId;
  const body = await request.json();
  const { is_public } = body;

  if (typeof is_public !== 'boolean') {
    return NextResponse.json({ error: 'Invalid is_public' }, { status: 400 });
  }

  const project = await getProjectById(projectId, user.id);
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await updateProject(projectId, user.id, { is_public });
  const updated = await getProjectById(projectId, user.id);
  return NextResponse.json(updated);
}
