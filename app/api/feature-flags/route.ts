import { NextResponse } from 'next/server';
import { BETA_MODE, MONETIZATION_ENABLED } from '@/lib/config/featureFlags';

/** Public endpoint for frontend feature flag checks */
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    BETA_MODE,
    MONETIZATION_ENABLED,
  });
}
