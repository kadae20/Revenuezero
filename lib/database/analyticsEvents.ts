import { supabaseAdmin } from '@/lib/utils/supabase';

export type AnalyticsEventName =
  | 'analysis_started'
  | 'preview_viewed'
  | 'checkout_clicked'
  | 'checkout_completed'
  | 'beta_analysis_completed';

export interface AnalyticsEventInsert {
  event_name: AnalyticsEventName;
  user_id?: string | null;
  project_id?: string | null;
  metadata?: Record<string, unknown>;
}

export async function trackEvent(event: AnalyticsEventInsert): Promise<void> {
  try {
    await supabaseAdmin.from('analytics_events').insert({
      event_name: event.event_name,
      user_id: event.user_id ?? null,
      project_id: event.project_id ?? null,
      metadata: event.metadata ?? {},
    });
  } catch (err) {
    console.error('Analytics track error:', err);
  }
}
