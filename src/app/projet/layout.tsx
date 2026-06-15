import { redirect } from "next/navigation";
import {
  auditExistingDashboardAccessWithoutPayment,
  getAuthRedirectPath,
  getCurrentUserPaymentAccess
} from "@/lib/payment-access";

export const dynamic = "force-dynamic";

export default async function ProjectRoutesLayout({ children }: { children: React.ReactNode }) {
  const access = await getCurrentUserPaymentAccess();
  await auditExistingDashboardAccessWithoutPayment("project_route_guard");

  if (!access.user) {
    redirect(getAuthRedirectPath("/dashboard"));
  }

  if (!access.hasActivePaidPlan) {
    redirect("/pricing?payment=required");
  }

  return children;
}
