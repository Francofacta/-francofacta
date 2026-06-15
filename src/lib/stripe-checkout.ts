import Stripe from "stripe";
import { getPlanKeyForPriceId, isCheckoutPlanKey, type CheckoutPlanKey } from "@/lib/pricing";

export function getStripeId(value: string | { id: string } | null) {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.id;
}

export function normalizeEmail(value: string | null | undefined) {
  const email = value?.trim().toLowerCase();

  return email && email.includes("@") ? email : null;
}

export function getCheckoutSessionEmail(session: Stripe.Checkout.Session) {
  return normalizeEmail(session.customer_details?.email ?? session.customer_email ?? session.metadata?.user_email);
}

export function getCheckoutSessionPlan(session: Stripe.Checkout.Session): CheckoutPlanKey {
  if (isCheckoutPlanKey(session.metadata?.plan)) {
    return session.metadata.plan;
  }

  const priceId = session.line_items?.data[0]?.price?.id;

  return getPlanKeyForPriceId(priceId) ?? "starter";
}

export function addMonths(date: Date, months: number) {
  const nextDate = new Date(date);
  nextDate.setMonth(nextDate.getMonth() + months);

  return nextDate;
}

export function getSubscriptionPeriodEnd(subscription: Stripe.Subscription) {
  const subscriptionWithPeriod = subscription as Stripe.Subscription & { current_period_end?: number };
  const itemWithPeriod = subscription.items.data[0] as Stripe.SubscriptionItem & { current_period_end?: number };

  return subscriptionWithPeriod.current_period_end ?? itemWithPeriod?.current_period_end;
}
