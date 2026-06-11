import { redirect } from "next/navigation";
import {
  auditExistingDashboardAccessWithoutPayment,
  getAuthRedirectPath,
  getCurrentUserPaymentAccess
} from "@/lib/payment-access";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const access = await getCurrentUserPaymentAccess();
  await auditExistingDashboardAccessWithoutPayment("onboarding_guard");

  if (!access.user) {
    redirect(getAuthRedirectPath("/onboarding"));
  }

  if (!access.hasActivePaidPlan) {
    redirect(`/api/stripe/checkout?plan=starter&next=${encodeURIComponent("/onboarding")}`);
  }

  return children;
}
