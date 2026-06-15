import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import {
  addMonths,
  getCheckoutSessionEmail,
  getCheckoutSessionPlan,
  getStripeId,
  getSubscriptionPeriodEnd
} from "@/lib/stripe-checkout";
import { createSignupPaymentProof } from "@/lib/signup-payment-proof";
import { getStripe } from "@/lib/stripe";
import { SignupForm } from "./SignupForm";

type SignupPageProps = {
  searchParams: Promise<{
    session_id?: string;
  }>;
};

function isCheckoutSessionId(value: string | undefined): value is string {
  return Boolean(value && value.startsWith("cs_"));
}

async function getPaidCheckoutSession(sessionId: string) {
  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["line_items", "subscription"] });

    if (session.payment_status !== "paid") {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { session_id: sessionId } = await searchParams;

  if (!isCheckoutSessionId(sessionId)) {
    redirect("/pricing");
  }

  const session = await getPaidCheckoutSession(sessionId);

  if (!session) {
    redirect("/pricing");
  }

  const plan = getCheckoutSessionPlan(session);
  const email = getCheckoutSessionEmail(session) ?? "";

  if (!email) {
    redirect("/pricing");
  }

  const subscription = typeof session.subscription === "object" ? session.subscription : null;
  const currentPeriodEnd = subscription ? getSubscriptionPeriodEnd(subscription) : null;
  const planExpiresAt =
    session.mode === "subscription"
      ? currentPeriodEnd
        ? new Date(currentPeriodEnd * 1000).toISOString()
        : null
      : addMonths(new Date(session.created * 1000), 12).toISOString();
  const paymentProof = createSignupPaymentProof({
    sessionId: session.id,
    plan,
    email: email || null,
    stripeCustomerId: getStripeId(session.customer),
    stripeSubscriptionId: getStripeId(session.subscription),
    stripePaymentIntentId: getStripeId(session.payment_intent),
    mode: session.mode,
    paymentStatus: session.payment_status,
    status: session.mode === "subscription" ? (subscription?.status ?? "active") : "paid",
    planExpiresAt,
    trialEnd: subscription?.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    priceId: session.line_items?.data[0]?.price?.id ?? null,
    paidAt: new Date().toISOString(),
    exp: Math.floor(Date.now() / 1000) + 30 * 60
  });

  return (
    <main className="auth-page">
      <Link href="/" className="brand auth-brand">
        <span>F</span>
        FrancoFacta
      </Link>
      <section className="card auth-card">
        <span className="eyebrow">
          <CheckCircle2 size={16} />
          Paiement confirmé
        </span>
        <h1>Créer un compte</h1>
        <SignupForm sessionId={session.id} paymentProof={paymentProof} initialEmail={email} plan={plan} />
      </section>
    </main>
  );
}
