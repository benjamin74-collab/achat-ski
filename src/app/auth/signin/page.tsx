// src/app/auth/signup/page.tsx
"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";

function getCallbackFromLocation(): string {
  if (typeof window === "undefined") return "/me";
  try {
    const sp = new URLSearchParams(window.location.search);
    return sp.get("callbackUrl") || "/me";
  } catch {
    return "/me";
  }
}

export default function SignupPage() {
  const [callbackUrl, setCallbackUrl] = useState("/me");

  const [pseudo, setPseudo] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newsletterOptIn, setNewsletterOptIn] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setCallbackUrl(getCallbackFromLocation());
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pseudo,
          firstName,
          lastName,
          email,
          password,
          newsletterOptIn,
          callbackUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const msg =
          data?.error ||
          data?.message ||
          "Inscription impossible. Vérifie les champs et réessaie.";
        throw new Error(msg);
      }

      setSuccess(true);
      // Redirection vers la connexion après inscription
      window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent(
        callbackUrl
      )}&registered=1`;
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Erreur inattendue lors de l’inscription."
      );
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-ring bg-white p-6 shadow-card">
        <h1 className="text-xl font-semibold text-center mb-1">
          Créer un compte
        </h1>
        <p className="text-xs text-neutral-600 text-center mb-4">
          Crée ton compte pour laisser des avis, proposer des tests, suivre tes
          contenus…
        </p>

        {error && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}

        {success && (
          <p className="mb-3 rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700">
            Compte créé avec succès. Redirection vers la page de connexion…
          </p>
        )}

        <form onSubmit={onSubmit} className="grid gap-3">
          <div className="grid gap-1">
            <label className="text-sm font-medium">Pseudo *</label>
            <input
              type="text"
              required
              className="input"
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              autoComplete="nickname"
            />
          </div>

          <div className="grid gap-1">
            <label className="text-sm font-medium">Prénom *</label>
            <input
              type="text"
              required
              className="input"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
            />
          </div>

          <div className="grid gap-1">
            <label className="text-sm font-medium">Nom *</label>
            <input
              type="text"
              required
              className="input"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
            />
          </div>

          <div className="grid gap-1">
            <label className="text-sm font-medium">Email *</label>
            <input
              type="email"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="grid gap-1">
            <label className="text-sm font-medium">Mot de passe *</label>
            <input
              type="password"
              required
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            <p className="text-xs text-neutral-500">
              Utilise un mot de passe robuste, différent de ceux d’autres
              sites.
            </p>
          </div>

          <label className="mt-2 flex items-start gap-2 text-xs text-neutral-700">
            <input
              type="checkbox"
              className="mt-[2px]"
              checked={newsletterOptIn}
              onChange={(e) => setNewsletterOptIn(e.target.checked)}
            />
            <span>
              J’accepte de recevoir des emails occasionnels de Meilleur-Ski
              (tests, bons plans, nouveautés). Tu pourras te désinscrire à tout
              moment.
            </span>
          </label>

          <button
            type="submit"
            className="btn mt-3"
            disabled={submitting}
          >
            {submitting ? "Création du compte..." : "Créer mon compte"}
          </button>
        </form>

        <p className="mt-4 text-xs text-neutral-600 text-center">
          Tu as déjà un compte ?{" "}
          <Link
            href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="underline"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  );
}
