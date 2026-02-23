import { supabaseAdmin } from '@/lib/utils/supabase';

const FREE_PREVIEW_LIMIT = 3;
const WINDOW_HOURS = 24;

export function hashIp(ip: string): string {
  // Simple hash for IP - in production use crypto.createHash
  let h = 0;
  for (let i = 0; i < ip.length; i++) {
    h = (h << 5) - h + ip.charCodeAt(i);
    h = h & 0xffffffff;
  }
  return `ip_${h.toString(16)}`;
}

export async function checkRateLimit(ip: string): Promise<{
  allowed: boolean;
  remaining: number;
  reason?: string;
}> {
  const ipHash = hashIp(ip);
  const windowStart = new Date();
  windowStart.setHours(windowStart.getHours() - WINDOW_HOURS);

  const { data: rows, error } = await supabaseAdmin
    .from('rate_limit_attempts')
    .select('*')
    .eq('ip_hash', ipHash)
    .limit(1);

  if (error) {
    return { allowed: true, remaining: FREE_PREVIEW_LIMIT };
  }

  const row = rows?.[0] as { attempt_count: number; window_start: string } | undefined;
  const windowStartDb = row ? new Date(row.window_start) : null;

  if (!row || windowStartDb < windowStart) {
    return { allowed: true, remaining: FREE_PREVIEW_LIMIT };
  }

  const count = row.attempt_count;
  if (count >= FREE_PREVIEW_LIMIT) {
    return {
      allowed: false,
      remaining: 0,
      reason: `Free preview limit (${FREE_PREVIEW_LIMIT}) reached. Sign up for full access.`,
    };
  }

  return { allowed: true, remaining: FREE_PREVIEW_LIMIT - count - 1 };
}

export async function incrementRateLimitAttempt(ip: string): Promise<void> {
  const ipHash = hashIp(ip);
  const { data: rows } = await supabaseAdmin
    .from('rate_limit_attempts')
    .select('*')
    .eq('ip_hash', ipHash)
    .limit(1);

  const row = rows?.[0];
  if (row) {
    await supabaseAdmin
      .from('rate_limit_attempts')
      .update({
        attempt_count: (row as { attempt_count: number }).attempt_count + 1,
        window_start:
          new Date((row as { window_start: string }).window_start) <
          new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000)
            ? new Date().toISOString()
            : (row as { window_start: string }).window_start,
        created_at: new Date().toISOString(),
      })
      .eq('ip_hash', ipHash);
  } else {
    await supabaseAdmin.from('rate_limit_attempts').insert({
      ip_hash: ipHash,
      attempt_count: 1,
      window_start: new Date().toISOString(),
    });
  }
}
