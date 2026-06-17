"use client";

import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { CheckoutPlanKey } from "@/lib/pricing";

type SignupFormProps = {
  initialEmail: string;
  plan: CheckoutPlanKey;
  sessionId: string;
};

export function SignupForm({ initialEmail, plan, sessionId }: SignupFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("Créez votre compte pour accéder à l'onboarding.");
  const [loading, setLoading] = useState(false);

  async function completeSignupPaymentLink() {
    if (!sessionId) {
      throw new Error("Session Stripe manquante. Relancez le paiement depuis la page tarifs.");
    }

    setMessage("Compte créé. Rattachement de votre paiement...");

    const response = await fetch("/api/signup/complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ session_id: sessionId })
    });
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      throw new Error(payload?.error ?? "Paiement confirmé, mais rattachement du compte indisponible.");
    }
  }

  async function submitSignup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isSupabaseConfigured()) {
      setMessage("Mode démo : ajoutez vos variables Supabase pour activer la création de compte.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
          data: {
            plan,
            ...(sessionId ? { session_id: sessionId } : {})
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        await completeSignupPaymentLink();
        window.location.href = "/onboarding";
        return;
      }

      setMessage("Compte créé. Vérifiez votre boîte mail pour confirmer votre email et accéder à l'onboarding.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Création de compte indisponible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <p className="muted">{message}</p>
      <form className="auth-form" onSubmit={submitSignup}>
        <div className="form-field">
          <label htmlFor="signup-email">Email professionnel</label>
          <div className="input-icon">
            <Mail size={18} />
            <input
              className="input"
              id="signup-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="vous@entreprise.fr"
              readOnly={Boolean(initialEmail)}
              required
            />
          </div>
        </div>
        <div className="form-field">
          <label htmlFor="signup-password">Mot de passe</label>
          <div className="input-icon password-input">
            <LockKeyhole size={18} />
            <input
              className="input"
              id="signup-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />
            <button
              className="password-toggle"
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <button className="button accent" type="submit" disabled={loading}>
          {loading ? "Création..." : "Créer mon compte"}
        </button>
      </form>
    </>
  );
}
