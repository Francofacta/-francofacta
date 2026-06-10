import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const stripe = getStripe();
  const signature = (await headers()).get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const payload = await request.text();

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Signature ou secret webhook manquant." }, { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object;
      const supabase = createServiceClient();

      await supabase.from("subscriptions").upsert(
        {
          stripe_subscription_id: subscription.id,
          stripe_customer_id:
            typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
          status: subscription.status,
          plan: subscription.metadata.plan ?? "starter",
          current_period_end: subscription.items.data[0]?.current_period_end
            ? new Date(subscription.items.data[0].current_period_end * 1000).toISOString()
            : null,
          trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: "stripe_subscription_id"
        }
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook Stripe invalide.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
