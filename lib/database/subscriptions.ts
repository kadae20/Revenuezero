import { supabaseAdmin } from '@/lib/utils/supabase';
import { Subscription, PlanType, PLAN_LIMITS } from '@/types';

const BILLING_CYCLE_DAYS = 30;

export async function getSubscriptionByUserId(userId: string): Promise<Subscription | null> {
  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing'])
    .single();

  if (error || !data) return null;
  const sub = data as Subscription;

  // Reset billing cycle if expired (Part 2)
  if (sub.billing_cycle_end && new Date(sub.billing_cycle_end) < new Date()) {
    await resetBillingCycle(userId);
    return getSubscriptionByUserId(userId);
  }
  return sub;
}

export async function resetBillingCycle(
  userId: string,
  periodEnd?: Date | null
): Promise<void> {
  const now = new Date();
  const end = periodEnd
    ? periodEnd
    : (() => {
        const e = new Date(now);
        e.setDate(e.getDate() + BILLING_CYCLE_DAYS);
        return e;
      })();

  await supabaseAdmin
    .from('subscriptions')
    .update({
      analyses_used_this_month: 0,
      billing_cycle_start: now.toISOString(),
      billing_cycle_end: end.toISOString(),
      current_period_end: end.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('user_id', userId)
    .in('status', ['active', 'trialing']);
}

function getEffectivePlan(plan: PlanType): PlanType {
  return plan === 'launch_mode' ? 'launch' : plan;
}

export async function canCreateReport(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  const subscription = await getSubscriptionByUserId(userId);
  if (!subscription) return { allowed: false, reason: 'No active subscription' };

  const limits = PLAN_LIMITS[getEffectivePlan(subscription.plan)];
  if (limits.reports >= 0 && subscription.reports_used >= limits.reports) {
    return { allowed: false, reason: 'Report limit reached. Upgrade for more.' };
  }
  return { allowed: true };
}

export async function canCreateReanalysis(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  const subscription = await getSubscriptionByUserId(userId);
  if (!subscription) return { allowed: false, reason: 'No active subscription' };

  const limits = PLAN_LIMITS[getEffectivePlan(subscription.plan)];
  const analysesUsed = subscription.analyses_used_this_month ?? subscription.reanalyses_used ?? 0;
  const perMonth = limits.analysesPerMonth ?? -1;

  if (perMonth >= 0 && analysesUsed >= perMonth) {
    return {
      allowed: false,
      reason: `Monthly analysis limit (${perMonth}) reached. Resets next billing cycle.`,
    };
  }
  return { allowed: true };
}

/** Part 5: Check monthly analysis limits + project limits */
export async function checkUsageLimits(
  userId: string,
  projectId: string | null,
  isNewProject: boolean
): Promise<{ allowed: boolean; reason?: string; limitType?: 'project' | 'analysis' }> {
  const subscription = await getSubscriptionByUserId(userId);
  if (!subscription) return { allowed: false, reason: 'No active subscription' };

  const limits = PLAN_LIMITS[getEffectivePlan(subscription.plan)];
  const analysesUsed = subscription.analyses_used_this_month ?? 0;

  let projectsCount = subscription.projects_count ?? 0;
  if (limits.maxProjects >= 0) {
    const { count } = await supabaseAdmin.from('projects').select('*', { count: 'exact', head: true }).eq('user_id', userId);
    projectsCount = count ?? projectsCount;
  }

  if (limits.analysesPerMonth >= 0 && analysesUsed >= limits.analysesPerMonth) {
    return {
      allowed: false,
      reason: `Monthly limit: ${limits.analysesPerMonth} analyses. Resets ${subscription.billing_cycle_end ? new Date(subscription.billing_cycle_end).toLocaleDateString() : 'soon'}.`,
      limitType: 'analysis',
    };
  }

  if (isNewProject && limits.maxProjects >= 0 && projectsCount >= limits.maxProjects) {
    return {
      allowed: false,
      reason: `Project limit: ${limits.maxProjects}. Upgrade for more projects.`,
      limitType: 'project',
    };
  }

  return { allowed: true };
}

export async function createSubscription(
  userId: string,
  stripeCustomerId: string,
  plan: PlanType,
  stripeSubscriptionId: string | null = null
): Promise<Subscription> {
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + BILLING_CYCLE_DAYS);

  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .insert({
      user_id: userId,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
      plan,
      status: 'active',
      reports_used: 0,
      reanalyses_used: 0,
      analyses_used_this_month: 0,
      projects_count: 0,
      billing_cycle_start: now.toISOString(),
      billing_cycle_end: end.toISOString(),
      current_period_end: end.toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create subscription: ${error.message}`);
  return data as Subscription;
}

/** Atomic increment with cycle reset in same tx - prevents race (Part 8) */
export async function incrementReportCount(userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc('try_increment_report_usage', {
    p_user_id: userId,
  });
  if (error) {
    const { data: fb } = await supabaseAdmin.rpc('increment_report_usage', { p_user_id: userId });
    if (fb === true) return true;
    const sub = await getSubscriptionByUserId(userId);
    if (!sub) return false;
    await supabaseAdmin
      .from('subscriptions')
      .update({
        reports_used: (sub.reports_used ?? 0) + 1,
        analyses_used_this_month: (sub.analyses_used_this_month ?? 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
    return true;
  }
  const res = Array.isArray(data) ? data[0] : data;
  return (res as { ok?: boolean })?.ok === true;
}

/** Atomic increment with cycle reset in same tx */
export async function incrementReanalysisCount(userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc('try_increment_reanalysis_usage', { p_user_id: userId });
  if (error) {
    const sub = await getSubscriptionByUserId(userId);
    if (!sub) return false;
    await supabaseAdmin
      .from('subscriptions')
      .update({
        reanalyses_used: (sub.reanalyses_used ?? 0) + 1,
        analyses_used_this_month: (sub.analyses_used_this_month ?? 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
    return true;
  }
  const result = Array.isArray(data) ? data[0] : data;
  return result?.ok === true;
}

/** Atomic increment */
export async function incrementProjectsCount(userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc('increment_projects_count', {
    p_user_id: userId,
  });
  if (error) {
    const sub = await getSubscriptionByUserId(userId);
    if (!sub) return false;
    await supabaseAdmin
      .from('subscriptions')
      .update({
        projects_count: (sub.projects_count ?? 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
    return true;
  }
  return data === true;
}

export async function updateSubscriptionStatus(
  stripeCustomerId: string,
  status: Subscription['status'],
  currentPeriodEnd: string | null = null
): Promise<void> {
  await supabaseAdmin
    .from('subscriptions')
    .update({
      status,
      current_period_end: currentPeriodEnd,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', stripeCustomerId);
}

export async function updateSubscriptionPlan(
  stripeCustomerId: string,
  plan: PlanType
): Promise<void> {
  await supabaseAdmin
    .from('subscriptions')
    .update({ plan, updated_at: new Date().toISOString() })
    .eq('stripe_customer_id', stripeCustomerId);
}

export async function cancelSubscription(stripeCustomerId: string): Promise<void> {
  await updateSubscriptionStatus(stripeCustomerId, 'canceled');
}
