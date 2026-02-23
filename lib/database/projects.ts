import { supabaseAdmin } from '@/lib/utils/supabase';
import { Project, SaaSInput } from '@/types';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

function uniqueSlug(base: string): string {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || 'project'}-${suffix}`;
}

export async function createProject(
  userId: string,
  name: string,
  input: SaaSInput
): Promise<Project> {
  const slug = uniqueSlug(generateSlug(name));
  const { data, error } = await supabaseAdmin
    .from('projects')
    .insert({
      user_id: userId,
      name,
      input: input as Record<string, unknown>,
      website_url: input.website_url || null,
      niche: input.target_user_guess || null,
      slug,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create project: ${error.message}`);
  return data as Project;
}

export async function getProjectById(
  projectId: string,
  userId: string
): Promise<Project | null> {
  const { data, error } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data as Project;
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const { data, error } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('slug', slug)
    .eq('is_public', true)
    .single();

  if (error || !data) return null;
  return data as Project;
}

export async function getProjectsByUserId(userId: string): Promise<Project[]> {
  const { data, error } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as Project[];
}

export async function updateProject(
  projectId: string,
  userId: string,
  updates: Partial<Pick<Project, 'name' | 'website_url' | 'niche' | 'is_public' | 'input'>>
): Promise<Project> {
  const { data, error } = await supabaseAdmin
    .from('projects')
    .update(updates as Record<string, unknown>)
    .eq('id', projectId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update project: ${error.message}`);
  return data as Project;
}
