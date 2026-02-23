import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/utils/stripe';
import {
  createSubscription,
  updateSubscriptionStatus,
  updateSubscriptionPlan,
  resetBillingCycle,
  cancelSubscription,
} from '@/lib/database/subscriptions';
import { trackEvent } from '@/lib/database/analyticsEvents';
import { tryMarkEventProcessed } from '@/lib/database/webhookIdempotency';
import { PlanType } from '@/types';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Webhook Error: ${msg}` }, { status: 400 });
  }

  // Insert-first idempotency: conflict = duplicate, skip
  const isFirst = await tryMarkEventProcessed(event.id);
  if (!isFirst) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(sub);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(sub);
        break;
      }
      case 'invoice.paid':
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoiceFailed(invoice);
        break;
      }
      default:
        break;
    }
    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId as string | undefined;
  const plan = (session.metadata?.plan || 'starter') as PlanType;
  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;

  if (!userId || !customerId) return;

  await trackEvent({
    event_name: 'checkout_completed',
    user_id: userId,
    project_id: session.metadata?.projectId ?? undefined,
    metadata: { plan },
  });

  const stripeSubId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
  try {
    await createSubscription(userId, customerId, plan, stripeSubId);
  } catch {
    // May already exist from subscription.created
  }
}

async function handleSubscriptionUpdated(stripeSub: Stripe.Subscription) {
  const customerId = typeof stripeSub.customer === 'string' ? stripeSub.customer : stripeSub.customer?.id;
  if (!customerId) return;

  const priceId = stripeSub.items?.data?.[0]?.price?.id;
  let plan: PlanType = 'starter';
  if (priceId) {
    const price = await stripe.prices.retrieve(priceId);
    const nick = (price.nickname || price.id || '').toLowerCase();
    if (nick.includes('growth')) plan = 'growth';
    else if (nick.includes('launch')) plan = 'launch';
  }

  const periodEnd = stripeSub.current_period_end
    ? new Date(stripeSub.current_period_end * 1000).toISOString()
    : null;

  await updateSubscriptionPlan(customerId, plan);
  await updateSubscriptionStatus(customerId, 'active', periodEnd);
}

async function handleSubscriptionDeleted(stripeSub: Stripe.Subscription) {
  const customerId = typeof stripeSub.customer === 'string' ? stripeSub.customer : stripeSub.customer?.id;
  if (!customerId) return;
  await cancelSubscription(customerId);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;

  const periodEnd = invoice.period_end ? new Date(invoice.period_end * 1000) : null;
  await updateSubscriptionStatus(customerId, 'active', periodEnd?.toISOString() ?? null);

  const { supabaseAdmin } = await import('@/lib/utils/supabase');
  const { data } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single();
  if (data?.user_id) {
    await resetBillingCycle(data.user_id, periodEnd);
  }
}

async function handleInvoiceFailed(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;
  await updateSubscriptionStatus(customerId, 'past_due');
}
