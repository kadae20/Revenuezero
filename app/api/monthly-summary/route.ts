import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateMonthlySummary, saveMonthlySnapshot } from '@/lib/utils/monthlySummary';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = authHeader.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const month = request.nextUrl.searchParams.get('month');
  const projectId = request.nextUrl.searchParams.get('projectId') || null;

  const monthStart = month
    ? new Date(month + '-01')
    : (() => {
        const d = new Date();
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        return d;
      })();

  const summary = await generateMonthlySummary(user.id, projectId, monthStart);
  await saveMonthlySnapshot(user.id, projectId, monthStart, summary);

  return NextResponse.json(summary);
}
