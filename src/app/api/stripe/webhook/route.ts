import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getPlanKeyForPriceId, isCheckoutPlanKey, type CheckoutPlanKey } from "@/lib/pricing";
import { createServiceClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

function getStripeId(value: string | { id: string } | null) {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.id;
}

function getPlanFromMetadataOrPrice(metadataPlan: string | undefined, priceId: string | null | undefined) {
  if (isCheckoutPlanKey(metadataPlan)) {
    return metadataPlan;
  }

  return getPlanKeyForPriceId(priceId) ?? "starter";
}

function getSubscriptionPeriodEnd(subscription: Stripe.Subscription) {
  const subscriptionWithPeriod = subscription as Stripe.Subscription & { current_period_end?: number };
  const itemWithPeriod = subscription.items.data[0] as Stripe.SubscriptionItem & { current_period_end?: number };

  return subscriptionWithPeriod.current_period_end ?? itemWithPeriod?.current_period_end;
}

function addMonths(date: Date, months: number) {
  const nextDate = new Date(date);
  nextDate.setMonth(nextDate.getMonth() + months);

  return nextDate;
}

type SupabaseServiceClient = ReturnType<typeof createServiceClient>;

type SubscriptionSyncContext = {
  userId?: string | null;
  email?: string | null;
  stripeCheckoutSessionId?: string | null;
};

function normalizeEmail(value: string | null | undefined) {
  const email = value?.trim().toLowerCase();

  return email && email.includes("@") ? email : null;
}

function getCheckoutSessionEmail(session: Stripe.Checkout.Session) {
  return normalizeEmail(session.customer_details?.email ?? session.customer_email ?? session.metadata?.user_email);
}

function getInviteRedirectTo() {
  const origin = process.env.NEXT_PUBLIC_APP_URL;

  if (!origin) {
    return undefined;
  }

  return new URL("/auth?next=/onboarding", origin).toString();
}

async function findProfileUserIdByEmail(supabase: SupabaseServiceClient, email: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle<{ id: string }>();

  return profile?.id ?? null;
}

async function findAuthUserIdByEmail(supabase: SupabaseServiceClient, email: string) {
  try {
    const profileUserId = await findProfileUserIdByEmail(supabase, email);

    if (profileUserId) {
      return profileUserId;
    }

    const perPage = 1000;

    for (let page = 1; page <= 10; page += 1) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });

      if (error) {
        console.warn("[stripe-webhook] Unable to inspect Supabase users by email", {
          email,
          error: error.message
        });
        return null;
      }

      const user = data.users.find((item) => normalizeEmail(item.email) === email);

      if (user) {
        return user.id;
      }

      if (data.users.length < perPage) {
        return null;
      }
    }

    console.warn("[stripe-webhook] Supabase user lookup reached page limit", { email });

    return null;
  } catch (error) {
    console.warn("[stripe-webhook] Unable to find Supabase user by email", {
      email,
      error: error instanceof Error ? error.message : String(error)
    });

    return null;
  }
}

async function findExistingUserIdForEmail(supabase: SupabaseServiceClient, email: string) {
  return findAuthUserIdByEmail(supabase, email);
}

async function ensurePaidCheckoutUser(session: Stripe.Checkout.Session, plan: CheckoutPlanKey) {
  const existingUserId = session.metadata?.user_id ?? session.client_reference_id;

  if (existingUserId) {
    return existingUserId;
  }

  if (session.payment_status !== "paid") {
    return null;
  }

  const email = getCheckoutSessionEmail(session);

  if (!email) {
    console.warn("[stripe-webhook] Paid checkout session missing customer email", {
      stripe_checkout_session_id: session.id,
      stripe_customer_id: getStripeId(session.customer),
      plan
    });
    return null;
  }

  const supabase = createServiceClient();
  const existingUserByEmail = await findExistingUserIdForEmail(supabase, email);

  if (existingUserByEmail) {
    return existingUserByEmail;
  }

  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: getInviteRedirectTo(),
    data: {
      plan,
      stripe_customer_id: getStripeId(session.customer),
      stripe_checkout_session_id: session.id
    }
  });

  if (error) {
    console.warn("[stripe-webhook] Unable to create paid Supabase user invitation", {
      email,
      stripe_checkout_session_id: session.id,
      error: error.message
    });

    return findExistingUserIdForEmail(supabase, email);
  }

  return data.user?.id ?? null;
}

async function findUserIdForStripeCustomer(stripeCustomerId: string | null, stripeSubscriptionId?: string | null) {
  if (!stripeCustomerId && !stripeSubscriptionId) {
    return null;
  }

  const supabase = createServiceClient();

  if (stripeSubscriptionId) {
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_subscription_id", stripeSubscriptionId)
      .maybeSingle<{ user_id: string | null }>();

    if (subscription?.user_id) {
      return subscription.user_id;
    }
  }

  if (!stripeCustomerId) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle<{ id: string }>();

  return profile?.id ?? null;
}

async function upsertProfilePaymentStatus({
  userId,
  email,
  plan,
  status,
  stripeCustomerId,
  stripeSubscriptionId,
  stripeCheckoutSessionId,
  planExpiresAt,
  paidAt
}: {
  userId: string;
  email?: string | null;
  plan: CheckoutPlanKey;
  status: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId?: string | null;
  stripeCheckoutSessionId?: string | null;
  planExpiresAt?: string | null;
  paidAt?: string | null;
}) {
  const supabase = createServiceClient();

  await supabase.from("profiles").upsert(
    {
      id: userId,
      email,
      plan,
      subscription_status: status,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
      stripe_checkout_session_id: stripeCheckoutSessionId,
      plan_expires_at: planExpiresAt,
      paid_at: paidAt,
      updated_at: new Date().toISOString()
    },
    { onConflict: "id" }
  );
}

async function syncCheckoutSession(session: Stripe.Checkout.Session) {
  const stripe = getStripe();
  const supabase = createServiceClient();
  const checkoutSessionPriceId = session.metadata?.plan
    ? undefined
    : (await stripe.checkout.sessions.retrieve(session.id, { expand: ["line_items"] })).line_items?.data[0]?.price?.id;
  const plan = getPlanFromMetadataOrPrice(session.metadata?.plan, checkoutSessionPriceId);
  const stripeCustomerId = getStripeId(session.customer);
  const email = getCheckoutSessionEmail(session);
  const userId = await ensurePaidCheckoutUser(session, plan);

  if (session.mode === "subscription" && session.subscription) {
    const subscriptionId = getStripeId(session.subscription);

    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      await syncSubscription(subscription, {
        userId,
        email,
        stripeCheckoutSessionId: session.id
      });
    }

    return;
  }

  if (session.mode !== "payment" || plan !== "perso" || session.payment_status !== "paid" || !userId) {
    return;
  }

  const planExpiresAt = addMonths(new Date(session.created * 1000), 12).toISOString();
  const paidAt = new Date().toISOString();
  const paymentIntentId = getStripeId(session.payment_intent);

  await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: null,
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      status: "paid",
      plan,
      current_period_end: planExpiresAt,
      trial_end: null,
      email,
      updated_at: paidAt
    },
    { onConflict: "stripe_checkout_session_id" }
  );

  await upsertProfilePaymentStatus({
    userId,
    email,
    plan,
    status: "paid",
    stripeCustomerId,
    stripeCheckoutSessionId: session.id,
    planExpiresAt,
    paidAt
  });
}

async function syncSubscription(subscription: Stripe.Subscription, context?: SubscriptionSyncContext) {
  const supabase = createServiceClient();
  const stripeCustomerId = getStripeId(subscription.customer);
  const stripeSubscriptionId = subscription.id;
  const priceId = subscription.items.data[0]?.price?.id;
  const plan = getPlanFromMetadataOrPrice(subscription.metadata?.plan, priceId);
  const currentPeriodEnd = getSubscriptionPeriodEnd(subscription);
  const currentPeriodEndIso = currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null;
  const trialEndIso = subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null;
  const email = normalizeEmail(subscription.metadata?.user_email ?? context?.email);
  const userId =
    subscription.metadata?.user_id ??
    context?.userId ??
    (await findUserIdForStripeCustomer(stripeCustomerId, stripeSubscriptionId));
  const updatedAt = new Date().toISOString();

  const subscriptionRow: {
    user_id: string | null;
    stripe_customer_id: string | null;
    stripe_subscription_id: string;
    stripe_checkout_session_id?: string;
    status: string;
    plan: CheckoutPlanKey;
    current_period_end: string | null;
    trial_end: string | null;
    price_id: string | undefined;
    email: string | null;
    updated_at: string;
  } = {
    user_id: userId,
    stripe_customer_id: stripeCustomerId,
    stripe_subscription_id: stripeSubscriptionId,
    status: subscription.status,
    plan,
    current_period_end: currentPeriodEndIso,
    trial_end: trialEndIso,
    price_id: priceId,
    email,
    updated_at: updatedAt
  };

  if (context?.stripeCheckoutSessionId) {
    subscriptionRow.stripe_checkout_session_id = context.stripeCheckoutSessionId;
  }

  await supabase.from("subscriptions").upsert(subscriptionRow, {
    onConflict: "stripe_subscription_id"
  });

  if (!userId) {
    console.warn("[stripe-webhook] Subscription event missing Supabase user_id metadata", {
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
      plan,
      status: subscription.status
    });
    return;
  }

  await upsertProfilePaymentStatus({
    userId,
    email,
    plan,
    status: subscription.status,
    stripeCustomerId,
    stripeSubscriptionId,
    planExpiresAt: currentPeriodEndIso,
    paidAt: subscription.status === "active" ? updatedAt : null
  });
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const signature = (await headers()).get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const payload = await request.text();

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Signature ou secret webhook manquant." }, { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    if (event.type === "checkout.session.completed") {
      await syncCheckoutSession(event.data.object);
    }

    if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
      await syncSubscription(event.data.object);
    }

    if (event.type === "customer.subscription.deleted") {
      await syncSubscription(event.data.object);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook Stripe invalide.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
