import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession, getCustomerByEmail, createCustomer } from '@/lib/stripe/checkout';
import { createSubscription } from '@/lib/database/subscriptions';
import { PlanType } from '@/types';
import { createClient } from '@supabase/supabase-js';
import { BETA_MODE, MONETIZATION_ENABLED } from '@/lib/config/featureFlags';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    if (BETA_MODE || !MONETIZATION_ENABLED) {
      return NextResponse.json(
        { error: 'Checkout disabled during beta', code: 'CHECKOUT_DISABLED' },
        { status: 400 }
      );
    }
    const body = await request.json();
    const { plan, projectId } = body;
    
    if (!plan || !['starter', 'growth', 'launch_mode', 'launch'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }
    
    // Get user from auth
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = user.id;
    const userEmail = user.email!;
    
    let customer = await getCustomerByEmail(userEmail);
    if (!customer) {
      customer = await createCustomer(userEmail, userId);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const successUrl = `${appUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${appUrl}/?canceled=true`;

    const session = await createCheckoutSession(
      userId,
      userEmail,
      plan as PlanType,
      successUrl,
      cancelUrl,
      customer?.id
    );
    
    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

