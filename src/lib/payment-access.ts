import type { User } from "@supabase/supabase-js";
import {
  createServiceClient,
  createUserServerClient,
  isSupabaseAuthConfigured,
  isSupabaseServiceConfigured
} from "@/lib/supabase/server";

export type PaidPlan = "perso" | "starter" | "pro";

type ProfileRow = {
  id: string;
  email: string | null;
  plan: string | null;
  subscription_status: string | null;
  plan_expires_at: string | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
};

type SubscriptionRow = {
  user_id: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_checkout_session_id?: string | null;
  status: string | null;
  plan: string | null;
  current_period_end: string | null;
};

export type PaymentAccess = {
  user: User | null;
  hasActivePaidPlan: boolean;
  plan?: PaidPlan;
  status?: string;
  reason?: "supabase_not_configured" | "unauthenticated" | "unpaid";
};

const paidPlans = new Set<string>(["perso", "starter", "pro"]);
const activePaidStatuses = new Set<string>(["active", "paid"]);

let auditPromise: Promise<void> | undefined;

export function isPaidPlan(plan: string | null | undefined): plan is PaidPlan {
  return Boolean(plan && paidPlans.has(plan));
}

export function isActivePaidStatus(status: string | null | undefined) {
  return Boolean(status && activePaidStatuses.has(status));
}

export function isFutureOrOpenEnded(value: string | null | undefined) {
  return !value || new Date(value).getTime() > Date.now();
}

function normalizePaidPlan(plan: string | null | undefined): PaidPlan | undefined {
  return isPaidPlan(plan) ? plan : undefined;
}

function profileHasPaidAccess(profile: ProfileRow | null | undefined) {
  if (!profile || !isFutureOrOpenEnded(profile.plan_expires_at)) {
    return false;
  }

  if (isActivePaidStatus(profile.subscription_status)) {
    return true;
  }

  return isPaidPlan(profile.plan) && !profile.subscription_status;
}

function subscriptionHasPaidAccess(subscription: SubscriptionRow | null | undefined) {
  return Boolean(
    subscription &&
      isPaidPlan(subscription.plan) &&
      isActivePaidStatus(subscription.status) &&
      isFutureOrOpenEnded(subscription.current_period_end)
  );
}

export async function getCurrentUserPaymentAccess(): Promise<PaymentAccess> {
  if (!isSupabaseAuthConfigured() || !isSupabaseServiceConfigured()) {
    return { user: null, hasActivePaidPlan: false, reason: "supabase_not_configured" };
  }

  const authClient = await createUserServerClient();
  const {
    data: { user },
    error: userError
  } = await authClient.auth.getUser();

  if (userError || !user) {
    return { user: null, hasActivePaidPlan: false, reason: "unauthenticated" };
  }

  const serviceClient = createServiceClient();
  const [{ data: profile }, { data: subscriptions }] = await Promise.all([
    serviceClient
      .from("profiles")
      .select("id,email,plan,subscription_status,plan_expires_at,stripe_customer_id,stripe_subscription_id")
      .eq("id", user.id)
      .maybeSingle<ProfileRow>(),
    serviceClient
      .from("subscriptions")
      .select("user_id,stripe_customer_id,stripe_subscription_id,stripe_checkout_session_id,status,plan,current_period_end")
      .eq("user_id", user.id)
      .in("status", Array.from(activePaidStatuses))
  ]);

  const activeSubscription = (subscriptions ?? []).find(subscriptionHasPaidAccess);
  const hasActivePaidPlan = profileHasPaidAccess(profile) || Boolean(activeSubscription);
  const plan = normalizePaidPlan(profile?.plan ?? activeSubscription?.plan);
  const status = profile?.subscription_status ?? activeSubscription?.status ?? undefined;

  return {
    user,
    hasActivePaidPlan,
    plan,
    status,
    reason: hasActivePaidPlan ? undefined : "unpaid"
  };
}

export function getSafeNextPath(nextPath: string | null | undefined, fallback = "/onboarding") {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return fallback;
  }

  return nextPath;
}

export function getAuthRedirectPath(nextPath: string) {
  return `/login?next=${encodeURIComponent(getSafeNextPath(nextPath))}`;
}

export async function auditExistingDashboardAccessWithoutPayment(source: string) {
  if (auditPromise || !isSupabaseServiceConfigured()) {
    return auditPromise;
  }

  auditPromise = runDashboardAccessAudit(source);

  return auditPromise;
}

async function runDashboardAccessAudit(source: string) {
  try {
    const supabase = createServiceClient();
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("owner_id")
      .not("owner_id", "is", null);

    if (projectsError || !projects?.length) {
      if (projectsError) {
        console.warn("[payment-audit] Unable to read projects for unpaid access audit", {
          source,
          error: projectsError.message
        });
      }
      return;
    }

    const projectCounts = new Map<string, number>();

    for (const project of projects as { owner_id: string | null }[]) {
      if (project.owner_id) {
        projectCounts.set(project.owner_id, (projectCounts.get(project.owner_id) ?? 0) + 1);
      }
    }

    const ownerIds = Array.from(projectCounts.keys());

    if (!ownerIds.length) {
      return;
    }

    const [{ data: profiles }, { data: subscriptions }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id,email,plan,subscription_status,plan_expires_at")
        .in("id", ownerIds)
        .returns<ProfileRow[]>(),
      supabase
        .from("subscriptions")
        .select("user_id,stripe_customer_id,stripe_subscription_id,stripe_checkout_session_id,status,plan,current_period_end")
        .in("user_id", ownerIds)
        .returns<SubscriptionRow[]>()
    ]);

    const profileByUserId = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
    const subscriptionsByUserId = new Map<string, SubscriptionRow[]>();

    for (const subscription of subscriptions ?? []) {
      if (!subscription.user_id) {
        continue;
      }

      subscriptionsByUserId.set(subscription.user_id, [
        ...(subscriptionsByUserId.get(subscription.user_id) ?? []),
        subscription
      ]);
    }

    const unpaidUsers = ownerIds
      .filter((userId) => {
        const profile = profileByUserId.get(userId);
        const userSubscriptions = subscriptionsByUserId.get(userId) ?? [];

        return !profileHasPaidAccess(profile) && !userSubscriptions.some(subscriptionHasPaidAccess);
      })
      .map((userId) => {
        const profile = profileByUserId.get(userId);

        return {
          user_id: userId,
          email: profile?.email ?? null,
          project_count: projectCounts.get(userId) ?? 0,
          plan: profile?.plan ?? null,
          subscription_status: profile?.subscription_status ?? null
        };
      });

    if (unpaidUsers.length) {
      console.warn("[payment-audit] Users with dashboard access but no confirmed Stripe payment", {
        source,
        users: unpaidUsers
      });
    } else {
      console.info("[payment-audit] No users with dashboard access and missing confirmed Stripe payment", { source });
    }
  } catch (error) {
    console.warn("[payment-audit] Existing user payment audit failed", {
      source,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
