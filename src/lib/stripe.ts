import Stripe from "stripe";

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY est requis pour créer une session Stripe.");
  }

  return new Stripe(secretKey, {
    apiVersion: "2026-05-27.dahlia",
    appInfo: {
      name: "FrancoFacta",
      version: "0.1.0"
    }
  });
}
