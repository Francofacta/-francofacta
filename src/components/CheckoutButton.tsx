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
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  async function startCheckout() {
    setStatus("loading");

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ plan })
      });
      const payload = (await response.json()) as { url?: string; error?: string };

      if (payload.url) {
        window.location.href = payload.url;
        return;
      }

      if (!response.ok) {
        throw new Error(payload.error ?? "Session Stripe indisponible.");
      }
    } catch {
      setStatus("error");
      window.location.href = "/?checkout=error#tarifs";
    }
  }

  return (
    <button
      className={`button ${variant === "secondary" ? "secondary" : variant === "accent" ? "accent" : ""}`}
      type="button"
      onClick={startCheckout}
      aria-live="polite"
    >
      {status === "loading" ? "Ouverture de Stripe..." : children}
      <ArrowRight size={18} />
    </button>
  );
}
