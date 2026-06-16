import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import {
  getCheckoutSessionEmail,
  getCheckoutSessionPlan,
} from "@/lib/stripe-checkout";
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

  return (
    <main className="auth-page">
      <Link href="/" className="brand auth-brand">
        <span>F</span>
        FrancoFacta
      </Link>
      <section className="card auth-card">
        <span className="eyebrow">
          <CheckCircle2 size={16} />
          Espace membre
        </span>
        <h1>Créer un compte</h1>
        <SignupForm initialEmail={email} plan={plan} />
      </section>
    </main>
  );
}
