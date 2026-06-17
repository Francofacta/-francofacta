import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  addMonths,
  getCheckoutSessionEmail,
  getCheckoutSessionPlan,
  getStripeId,
  getSubscriptionPeriodEnd,
  normalizeEmail
} from "@/lib/stripe-checkout";
import { getStripe } from "@/lib/stripe";
import { type SignupPaymentProofPayload, verifySignupPaymentProof } from "@/lib/signup-payment-proof";
import {
  createServiceClient,
  createUserServerClient,
  isSupabaseAuthConfigured,
  isSupabaseServiceConfigured
} from "@/lib/supabase/server";

type CompleteSignupBody = {
  session_id?: string;
  payment_proof?: string;
};

function isCheckoutSessionId(value: string | undefined): value is string {
  return Boolean(value && value.startsWith("cs_"));
}

function isSupportedCheckoutMode(mode: string | null | undefined): mode is "payment" | "subscription" {
  return mode === "payment" || mode === "subscription";
}

async function getCheckoutSubscription(stripe: Stripe, session: Stripe.Checkout.Session) {
  if (!session.subscription) {
    return null;
  }

  if (typeof session.subscription === "string") {
    return stripe.subscriptions.retrieve(session.subscription);
  }

  return session.subscription as Stripe.Subscription;
}

async function getPaymentProofFromStripeSession(sessionId: string): Promise<SignupPaymentProofPayload | null> {
  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["line_items", "subscription"] });

    if (session.payment_status !== "paid" || !isSupportedCheckoutMode(session.mode)) {
      return null;
    }

    const subscription = session.mode === "subscription" ? await getCheckoutSubscription(stripe, session) : null;
    const currentPeriodEnd = subscription ? getSubscriptionPeriodEnd(subscription) : null;
    const planExpiresAt =
      session.mode === "subscription"
        ? currentPeriodEnd
          ? new Date(currentPeriodEnd * 1000).toISOString()
          : null
        : addMonths(new Date(session.created * 1000), 12).toISOString();

    return {
      sessionId: session.id,
      plan: getCheckoutSessionPlan(session),
      email: getCheckoutSessionEmail(session),
      stripeCustomerId: getStripeId(session.customer),
      stripeSubscriptionId: getStripeId(session.subscription),
      stripePaymentIntentId: getStripeId(session.payment_intent),
      mode: session.mode,
      paymentStatus: session.payment_status,
      status: session.mode === "subscription" ? (subscription?.status ?? "active") : "paid",
      planExpiresAt,
      trialEnd: subscription?.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      priceId: session.line_items?.data[0]?.price?.id ?? subscription?.items.data[0]?.price?.id ?? null,
      paidAt: new Date(session.created * 1000).toISOString(),
      exp: session.created + 30 * 24 * 60 * 60
    };
  } catch (error) {
    console.warn("[signup-complete] Unable to retrieve paid Stripe checkout session", {
      session_id: sessionId,
      error: error instanceof Error ? error.message : String(error)
    });

    return null;
  }
}

export async function POST(request: Request) {
  if (!isSupabaseAuthConfigured() || !isSupabaseServiceConfigured()) {
    return NextResponse.json({ error: "Supabase n'est pas configuré." }, { status: 500 });
  }

  const body = (await request.json()) as CompleteSignupBody;

  if (!isCheckoutSessionId(body.session_id)) {
    return NextResponse.json({ error: "Session Stripe invalide." }, { status: 400 });
  }

  const paymentProof = body.payment_proof
    ? verifySignupPaymentProof(body.payment_proof)
    : await getPaymentProofFromStripeSession(body.session_id);

  if (!paymentProof || paymentProof.sessionId !== body.session_id || paymentProof.paymentStatus !== "paid") {
    return NextResponse.json({ error: "Session Stripe payée introuvable." }, { status: 400 });
  }

  if (!isSupportedCheckoutMode(paymentProof.mode)) {
    return NextResponse.json({ error: "Mode Stripe invalide." }, { status: 400 });
  }

  const authClient = await createUserServerClient();
  const {
    data: { user },
    error: userError
  } = await authClient.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Utilisateur Supabase non authentifié." }, { status: 401 });
  }

  const supabase = createServiceClient();
  const sessionEmail = normalizeEmail(paymentProof.email);
  const userEmail = normalizeEmail(user.email);

  if (sessionEmail && userEmail && sessionEmail !== userEmail) {
    return NextResponse.json({ error: "L'email du compte ne correspond pas au paiement Stripe." }, { status: 403 });
  }

  const email = userEmail ?? sessionEmail;
  const now = new Date().toISOString();

  if (paymentProof.mode === "subscription") {
    if (!paymentProof.stripeSubscriptionId) {
      return NextResponse.json({ error: "Abonnement Stripe introuvable." }, { status: 400 });
    }

    const { error: subscriptionError } = await supabase.from("subscriptions").upsert(
      {
        user_id: user.id,
        stripe_customer_id: paymentProof.stripeCustomerId,
        stripe_subscription_id: paymentProof.stripeSubscriptionId,
        stripe_checkout_session_id: paymentProof.sessionId,
        status: paymentProof.status,
        plan: paymentProof.plan,
        current_period_end: paymentProof.planExpiresAt,
        trial_end: paymentProof.trialEnd,
        price_id: paymentProof.priceId,
        email,
        updated_at: now
      },
      { onConflict: "stripe_subscription_id" }
    );

    if (subscriptionError) {
      return NextResponse.json({ error: subscriptionError.message }, { status: 500 });
    }
  } else {
    const { error: subscriptionError } = await supabase.from("subscriptions").upsert(
      {
        user_id: user.id,
        stripe_customer_id: paymentProof.stripeCustomerId,
        stripe_subscription_id: null,
        stripe_checkout_session_id: paymentProof.sessionId,
        stripe_payment_intent_id: paymentProof.stripePaymentIntentId,
        status: paymentProof.status,
        plan: paymentProof.plan,
        current_period_end: paymentProof.planExpiresAt,
        trial_end: null,
        email,
        updated_at: now
      },
      { onConflict: "stripe_checkout_session_id" }
    );

    if (subscriptionError) {
      return NextResponse.json({ error: subscriptionError.message }, { status: 500 });
    }
  }

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email,
      plan: paymentProof.plan,
      subscription_status: paymentProof.status,
      stripe_customer_id: paymentProof.stripeCustomerId,
      stripe_subscription_id: paymentProof.stripeSubscriptionId,
      stripe_checkout_session_id: paymentProof.sessionId,
      plan_expires_at: paymentProof.planExpiresAt,
      paid_at: paymentProof.paidAt,
      updated_at: now
    },
    { onConflict: "id" }
  );

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
