import { redirect } from "next/navigation";
import {
  auditExistingDashboardAccessWithoutPayment,
  getAuthRedirectPath,
  getCurrentUserPaymentAccess
} from "@/lib/payment-access";

export const dynamic = "force-dynamic";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const access = await getCurrentUserPaymentAccess();
  await auditExistingDashboardAccessWithoutPayment("onboarding_guard");

  if (!access.user) {
    redirect(getAuthRedirectPath("/onboarding"));
  }

  if (!access.hasActivePaidPlan) {
    redirect("/pricing?payment=required");
  }

  return children;
}
