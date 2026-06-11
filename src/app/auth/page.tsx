"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LockKeyhole, Mail } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("Connectez-vous pour synchroniser vos projets FrancoFacta.");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkout = new URLSearchParams(window.location.search).get("checkout");

    if (checkout === "success") {
      setMessage("Paiement confirmé. Consultez votre email pour finaliser l'accès à votre compte, puis connectez-vous.");
    }
  }, []);

  function getRedirectTarget() {
    const next = new URLSearchParams(window.location.search).get("next");

    if (!next || !next.startsWith("/") || next.startsWith("//")) {
      return "/onboarding";
    }

    return next;
  }

  async function submitAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isSupabaseConfigured()) {
      setMessage("Mode démo : ajoutez vos variables Supabase pour activer l'authentification.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    window.location.href = getRedirectTarget();
  }

  return (
    <main className="auth-page">
      <Link href="/" className="brand auth-brand">
        <span>F</span>
        FrancoFacta
      </Link>
      <section className="card auth-card">
        <span className="eyebrow">
          <LockKeyhole size={16} />
          Espace associé
        </span>
        <h1>Connexion</h1>
        <p className="muted">{message}</p>
        <form className="auth-form" onSubmit={submitAuth}>
          <div className="form-field">
            <label htmlFor="email">Email professionnel</label>
            <div className="input-icon">
              <Mail size={18} />
              <input
                className="input"
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="vous@entreprise.fr"
                required
              />
            </div>
          </div>
          <div className="form-field">
            <label htmlFor="password">Mot de passe</label>
            <input
              className="input"
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />
          </div>
          <button className="button accent" type="submit" disabled={loading}>
            {loading ? "Vérification..." : "Se connecter"}
          </button>
        </form>
        <Link className="link-button" href="/#tarifs">
          Pas encore de compte ? S'inscrire
        </Link>
      </section>
    </main>
  );
}
