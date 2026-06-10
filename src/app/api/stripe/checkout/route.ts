import { NextResponse } from "next/server";
import { getCheckoutMode, getPriceId, type CheckoutPlanKey } from "@/lib/pricing";
import { getStripe } from "@/lib/stripe";

type CheckoutBody = {
  plan?: CheckoutPlanKey;
  email?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CheckoutBody;
    const plan = body.plan ?? "starter";
    const priceId = getPriceId(plan);
    const checkoutMode = getCheckoutMode(plan);

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
      mode: checkoutMode,
      customer_email: body.email,
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      ...(checkoutMode === "subscription"
        ? {
            subscription_data: {
              metadata: {
                app: "francofacta",
                plan
              }
            }
          }
        : {
            payment_intent_data: {
              metadata: {
                app: "francofacta",
                plan
              }
            }
          }),
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
