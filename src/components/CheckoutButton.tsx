"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import type { CheckoutPlanKey } from "@/lib/pricing";

type CheckoutButtonProps = {
  plan: CheckoutPlanKey;
  children: React.ReactNode;
  variant?: "primary" | "accent" | "secondary";
};

export function CheckoutButton({ plan, children, variant = "primary" }: CheckoutButtonProps) {
  const [status, setStatus] = useState<"idle" | "collecting" | "loading" | "error">("idle");
  const [email, setEmail] = useState("");

  async function startCheckout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ plan, email })
      });
      const payload = (await response.json()) as { url?: string; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Session Stripe indisponible.");
      }

      if (payload.url) {
        window.location.href = payload.url;
        return;
      }

      throw new Error("Session Stripe indisponible.");
    } catch {
      setStatus("error");
      window.location.href = "/?checkout=error#tarifs";
    }
  }

  if (status === "collecting" || status === "loading") {
    return (
      <form className="checkout-email-form" onSubmit={startCheckout}>
        <input
          className="input"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="votre@email.fr"
          aria-label="Email pour le paiement Stripe"
          required
          disabled={status === "loading"}
        />
        <button
          className={`button ${variant === "secondary" ? "secondary" : variant === "accent" ? "accent" : ""}`}
          type="submit"
          disabled={status === "loading"}
          aria-live="polite"
        >
          {status === "loading" ? "Ouverture de Stripe..." : "Continuer"}
          <ArrowRight size={18} />
        </button>
      </form>
    );
  }

  return (
    <button
      className={`button ${variant === "secondary" ? "secondary" : variant === "accent" ? "accent" : ""}`}
      type="button"
      onClick={() => setStatus("collecting")}
      aria-live="polite"
    >
      {status === "error" ? "Réessayer" : children}
      <ArrowRight size={18} />
    </button>
  );
}
