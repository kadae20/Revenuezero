import { stripe } from '@/lib/utils/stripe';
import { PlanType, PLAN_PRICES } from '@/types';

/** Recurring subscription mode (Part 7) */
const SUBSCRIPTION_MODE = true;

export async function createCheckoutSession(
  userId: string,
  userEmail: string,
  plan: PlanType,
  successUrl: string,
  cancelUrl: string,
  stripeCustomerId?: string | null
) {
  const priceId = await getOrCreateRecurringPriceId(plan);

  const sessionConfig: Parameters<typeof stripe.checkout.sessions.create>[0] = {
    payment_method_types: ['card'],
    mode: SUBSCRIPTION_MODE ? 'subscription' : 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId, plan },
    line_items: [{ price: priceId, quantity: 1 }],
  };

  if (SUBSCRIPTION_MODE) {
    sessionConfig.customer = stripeCustomerId || undefined;
    sessionConfig.customer_email = !stripeCustomerId ? userEmail : undefined;
    sessionConfig.subscription_data = {
      trial_period_days: 0,
      metadata: { userId, plan },
    };
  } else {
    sessionConfig.customer_email = userEmail;
  }

  const session = await stripe.checkout.sessions.create(sessionConfig);
  return session;
}

async function getOrCreateRecurringPriceId(plan: PlanType): Promise<string> {
  const priceIdKey = `STRIPE_PRICE_ID_${plan.toUpperCase().replace('-', '_')}`;
  const existing = process.env[priceIdKey];
  if (existing) return existing;

  const product = await stripe.products.create({
    name: `RevenueZero ${plan.charAt(0).toUpperCase() + plan.slice(1)}`,
    description: `RevenueZero ${plan} - Monthly subscription`,
  });

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: PLAN_PRICES[plan] * 100,
    currency: 'usd',
    recurring: { interval: 'month' },
  });
  return price.id;
}

export async function getCustomerByEmail(email: string) {
  const customers = await stripe.customers.list({ email, limit: 1 });
  return customers.data[0] || null;
}

export async function createCustomer(email: string, userId: string) {
  return await stripe.customers.create({ email, metadata: { userId } });
}
