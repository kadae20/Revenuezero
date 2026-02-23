import { NextRequest, NextResponse } from 'next/server';
import { trackEvent, AnalyticsEventName } from '@/lib/database/analyticsEvents';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event_name, project_id, metadata } = body;

    const valid: AnalyticsEventName[] = [
      'analysis_started',
      'preview_viewed',
      'checkout_clicked',
      'checkout_completed',
    ];
    if (!event_name || !valid.includes(event_name)) {
      return NextResponse.json({ error: 'Invalid event' }, { status: 400 });
    }

    await trackEvent({
      event_name,
      project_id: project_id ?? null,
      metadata: metadata ?? {},
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to track' }, { status: 500 });
  }
}
