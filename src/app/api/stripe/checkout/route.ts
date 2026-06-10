import { NextResponse } from "next/server";
import { getPriceId, type PlanKey } from "@/lib/pricing";
import { getStripe } from "@/lib/stripe";

type CheckoutBody = {
  plan?: PlanKey;
  email?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CheckoutBody;
    const plan = body.plan ?? "starter";
    const priceId = getPriceId(plan);

    if (!priceId) {
      return NextResponse.json(
        {
          error: `Aucun price id Stripe configure pour le plan ${plan}.`
        },
        { status: 400 }
      );
    }

    const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: body.email,
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          app: "francofacta",
          plan
        }
      },
      allow_promotion_codes: true,
      success_url: `${origin}/onboarding?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?checkout=cancelled`
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur Stripe inconnue.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
