import { supabaseAdmin } from '@/lib/utils/supabase';

/**
 * Insert-first idempotency: try insert, conflict = duplicate → skip processing.
 * Returns true if we are the first processor (insert succeeded).
 */
export async function tryMarkEventProcessed(stripeEventId: string): Promise<boolean> {
  const { error } = await supabaseAdmin.from('webhook_events_processed').insert({
    stripe_event_id: stripeEventId,
  });
  if (error) {
    if (error.code === '23505') return false; // unique_violation = duplicate
    throw error;
  }
  return true;
}

export async function isEventProcessed(stripeEventId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('webhook_events_processed')
    .select('id')
    .eq('stripe_event_id', stripeEventId)
    .maybeSingle();
  return !!data;
}

export async function markEventProcessed(stripeEventId: string): Promise<void> {
  await supabaseAdmin.from('webhook_events_processed').insert({
    stripe_event_id: stripeEventId,
  });
}
