"use client";

import Link from "next/link";
import { useState } from "react";
import { LockKeyhole, Mail } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

type AuthMode = "signin" | "reset";

const modeContent: Record<AuthMode, { title: string; message: string; submit: string; loading: string }> = {
  signin: {
    title: "Connexion",
    message: "Connectez-vous pour synchroniser vos projets FrancoFacta.",
    submit: "Se connecter",
    loading: "Vérification..."
  },
  reset: {
    title: "Réinitialiser le mot de passe",
    message: "Recevez un lien de réinitialisation sur votre email professionnel.",
    submit: "Envoyer le lien",
    loading: "Envoi..."
  }
};

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(modeContent.signin.message);
  const [loading, setLoading] = useState(false);

  function getRedirectTarget() {
    const next = new URLSearchParams(window.location.search).get("next");

    if (!next || !next.startsWith("/") || next.startsWith("//")) {
      return "/onboarding";
    }

    return next;
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setMessage(modeContent[nextMode].message);
    setPassword("");
  }

  async function submitAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isSupabaseConfigured()) {
      setMessage("Mode démo : ajoutez vos variables Supabase pour activer l'authentification.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error } =
      mode === "reset"
          ? await supabase.auth.resetPasswordForEmail(email)
          : await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (mode === "reset") {
      setMessage("Lien de réinitialisation envoyé si cet email existe.");
      return;
    }

    window.location.href = getRedirectTarget();
  }

  const content = modeContent[mode];

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
        <h1>{content.title}</h1>
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
          {mode !== "reset" ? (
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
          ) : null}
          <button className="button accent" type="submit" disabled={loading}>
            {loading ? content.loading : content.submit}
          </button>
        </form>
        <div className="auth-links">
          <button className="link-button" type="button" onClick={() => switchMode("signin")} disabled={mode === "signin"}>
            Se connecter
          </button>
          <Link className="link-button" href="/pricing">
            Créer un compte
          </Link>
          <button className="link-button" type="button" onClick={() => switchMode("reset")} disabled={mode === "reset"}>
            Mot de passe oublié ?
          </button>
        </div>
      </section>
    </main>
  );
}
