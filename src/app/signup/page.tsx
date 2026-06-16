import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { isCheckoutPlanKey, type CheckoutPlanKey } from "@/lib/pricing";
import { SignupForm } from "./SignupForm";

type SignupPageProps = {
  searchParams: Promise<{
    session_id?: string | string[];
    plan?: string | string[];
    email?: string | string[];
  }>;
};

function getFirstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeEmail(value: string | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function getSignupPlan(value: string | undefined): CheckoutPlanKey {
  return isCheckoutPlanKey(value) ? value : "starter";
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const sessionId = getFirstSearchParam(params.session_id) ?? "";
  const plan = getSignupPlan(getFirstSearchParam(params.plan));
  const email = normalizeEmail(getFirstSearchParam(params.email));

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
        <SignupForm initialEmail={email} plan={plan} sessionId={sessionId} />
      </section>
    </main>
  );
}
