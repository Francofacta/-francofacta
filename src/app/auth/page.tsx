"use client";

import Link from "next/link";
import { useState } from "react";
import { LockKeyhole, Mail } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [message, setMessage] = useState("Connectez-vous pour synchroniser vos projets FrancoFacta.");
  const [loading, setLoading] = useState(false);

  async function submitAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isSupabaseConfigured()) {
      setMessage("Mode démo : ajoutez vos variables Supabase pour activer l'authentification.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const authCall =
      mode === "signin"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/onboarding`
            }
          });

    const { error } = await authCall;
    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    window.location.href = "/onboarding";
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
        <h1>{mode === "signin" ? "Connexion" : "Création de compte"}</h1>
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
            {loading ? "Vérification..." : mode === "signin" ? "Se connecter" : "Créer mon compte"}
          </button>
        </form>
        <button
          className="link-button"
          type="button"
          onClick={() => setMode((current) => (current === "signin" ? "signup" : "signin"))}
        >
          {mode === "signin" ? "Pas encore de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
        </button>
      </section>
    </main>
  );
}
