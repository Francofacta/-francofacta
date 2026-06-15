import { NextResponse } from "next/server";
import { getCheckoutMode, getPriceId, isCheckoutPlanKey, type CheckoutPlanKey } from "@/lib/pricing";
import { getStripe } from "@/lib/stripe";

type CheckoutBody = {
  plan?: CheckoutPlanKey;
};

function getOrigin(request: Request) {
  return request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function buildUrl(origin: string, path: string) {
  return new URL(path, origin).toString();
}

function getSignupSuccessUrl(origin: string) {
  const url = new URL("/signup", origin);
  url.searchParams.set("session_id", "{CHECKOUT_SESSION_ID}");

  return url.toString();
}

async function createCheckoutUrl(request: Request, plan: CheckoutPlanKey) {
  const priceId = getPriceId(plan);
  const checkoutMode = getCheckoutMode(plan);
  const metadata: Record<string, string> = {
    app: "francofacta",
    plan
  };

  if (!priceId) {
    return {
      status: 400,
      error: `Aucun price id Stripe configuré pour le plan ${plan}.`
    };
  }

  const origin = getOrigin(request);
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: checkoutMode,
    metadata,
    line_items: [
      {
        price: priceId,
        quantity: 1
      }
    ],
    ...(checkoutMode === "subscription"
      ? {
          subscription_data: {
            metadata
          }
        }
      : {
          payment_intent_data: {
            metadata
          }
        }),
    ...(checkoutMode === "payment" ? { customer_creation: "always" as const } : {}),
    allow_promotion_codes: true,
    success_url: getSignupSuccessUrl(origin),
    cancel_url: buildUrl(origin, "/pricing")
  });

  return { status: 200, url: session.url };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const rawPlan = url.searchParams.get("plan");
    const plan = isCheckoutPlanKey(rawPlan) ? rawPlan : "starter";
    const checkout = await createCheckoutUrl(request, plan);

    if (!checkout.url) {
      return NextResponse.json(
        {
          error: checkout.error ?? "Session Stripe indisponible."
        },
        { status: checkout.status }
      );
    }

    return NextResponse.redirect(checkout.url, { status: 303 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur Stripe inconnue.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CheckoutBody;
    const plan = isCheckoutPlanKey(body.plan) ? body.plan : "starter";
    const checkout = await createCheckoutUrl(request, plan);

    if (!checkout.url) {
      return NextResponse.json(
        {
          error: checkout.error ?? "Session Stripe indisponible."
        },
        { status: checkout.status }
      );
    }

    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur Stripe inconnue.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
