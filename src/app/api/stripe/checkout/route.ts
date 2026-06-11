import { NextResponse } from "next/server";
import { getAuthRedirectPath, getSafeNextPath } from "@/lib/payment-access";
import { getCheckoutMode, getPriceId, isCheckoutPlanKey, type CheckoutPlanKey } from "@/lib/pricing";
import { createUserServerClient, isSupabaseAuthConfigured } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

type CheckoutBody = {
  plan?: CheckoutPlanKey;
  email?: string;
  next?: string;
};

async function getAuthenticatedUser() {
  if (!isSupabaseAuthConfigured()) {
    return null;
  }

  const supabase = await createUserServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user;
}

function getOrigin(request: Request) {
  return request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function buildUrl(origin: string, path: string) {
  return new URL(path, origin).toString();
}

function getSuccessUrl(origin: string, nextPath: string) {
  const url = new URL(getSafeNextPath(nextPath), origin);
  url.searchParams.set("checkout", "success");
  url.searchParams.set("session_id", "{CHECKOUT_SESSION_ID}");

  return url.toString();
}

async function createCheckoutUrl(request: Request, plan: CheckoutPlanKey, nextPath: string) {
  const user = await getAuthenticatedUser();

  if (!user?.email) {
    return {
      status: 401,
      authUrl: getAuthRedirectPath(`/api/stripe/checkout?plan=${plan}&next=${encodeURIComponent(nextPath)}`)
    };
  }

  const priceId = getPriceId(plan);
  const checkoutMode = getCheckoutMode(plan);
  const metadata = {
    app: "francofacta",
    plan,
    user_id: user.id,
    user_email: user.email
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
    client_reference_id: user.id,
    customer_email: user.email,
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
            metadata,
            ...(plan === "starter" ? { trial_period_days: 14 } : {})
          }
        }
      : {
          payment_intent_data: {
            metadata
          }
        }),
    allow_promotion_codes: true,
    success_url: getSuccessUrl(origin, nextPath),
    cancel_url: buildUrl(origin, "/?checkout=cancelled#tarifs")
  });

  return { status: 200, url: session.url };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const rawPlan = url.searchParams.get("plan");
    const plan = isCheckoutPlanKey(rawPlan) ? rawPlan : "starter";
    const nextPath = getSafeNextPath(url.searchParams.get("next"));
    const checkout = await createCheckoutUrl(request, plan, nextPath);

    if (checkout.authUrl) {
      return NextResponse.redirect(buildUrl(getOrigin(request), checkout.authUrl), { status: 303 });
    }

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
    const checkout = await createCheckoutUrl(request, plan, getSafeNextPath(body.next));

    if (checkout.authUrl) {
      return NextResponse.json(
        {
          error: "Connectez-vous avant de démarrer le paiement.",
          url: checkout.authUrl
        },
        { status: 401 }
      );
    }

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
