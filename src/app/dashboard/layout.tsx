import { redirect } from "next/navigation";
import {
  auditExistingDashboardAccessWithoutPayment,
  getAuthRedirectPath,
  getCurrentUserPaymentAccess
} from "@/lib/payment-access";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const access = await getCurrentUserPaymentAccess();
  await auditExistingDashboardAccessWithoutPayment("dashboard_guard");

  if (!access.user) {
    redirect(getAuthRedirectPath("/dashboard"));
  }

  if (!access.hasActivePaidPlan) {
    redirect("/pricing?payment=required");
  }

  return children;
}
