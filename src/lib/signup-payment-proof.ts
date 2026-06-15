import { createHmac, timingSafeEqual } from "crypto";
import type { CheckoutPlanKey } from "@/lib/pricing";

export type SignupPaymentProofPayload = {
  sessionId: string;
  plan: CheckoutPlanKey;
  email: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePaymentIntentId: string | null;
  mode: "payment" | "subscription" | "setup" | null;
  paymentStatus: string;
  status: string;
  planExpiresAt: string | null;
  trialEnd: string | null;
  priceId: string | null;
  paidAt: string;
  exp: number;
};

function getProofSecret() {
  const secret = process.env.SIGNUP_PAYMENT_PROOF_SECRET ?? process.env.STRIPE_SECRET_KEY;

  if (!secret) {
    throw new Error("SIGNUP_PAYMENT_PROOF_SECRET ou STRIPE_SECRET_KEY est requis pour signer l'inscription.");
  }

  return secret;
}

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payload: string) {
  return createHmac("sha256", getProofSecret()).update(payload).digest("base64url");
}

export function createSignupPaymentProof(payload: SignupPaymentProofPayload) {
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifySignupPaymentProof(token: string): SignupPaymentProofPayload | null {
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signPayload(encodedPayload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload)) as SignupPaymentProofPayload;

  if (payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
}
