import { NextResponse } from "next/server";
import { normalizeEmail } from "@/lib/stripe-checkout";
import { verifySignupPaymentProof } from "@/lib/signup-payment-proof";
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

export async function POST(request: Request) {
  if (!isSupabaseAuthConfigured() || !isSupabaseServiceConfigured()) {
    return NextResponse.json({ error: "Supabase n'est pas configuré." }, { status: 500 });
  }

  const body = (await request.json()) as CompleteSignupBody;

  if (!isCheckoutSessionId(body.session_id)) {
    return NextResponse.json({ error: "Session Stripe invalide." }, { status: 400 });
  }

  const paymentProof = body.payment_proof ? verifySignupPaymentProof(body.payment_proof) : null;

  if (!paymentProof || paymentProof.sessionId !== body.session_id || paymentProof.paymentStatus !== "paid") {
    return NextResponse.json({ error: "Preuve de paiement invalide." }, { status: 400 });
  }

  if (paymentProof.mode !== "payment" && paymentProof.mode !== "subscription") {
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

    await supabase.from("subscriptions").upsert(
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
  } else {
    await supabase.from("subscriptions").upsert(
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
  }

  await supabase.from("profiles").upsert(
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

  return NextResponse.json({ ok: true });
}
