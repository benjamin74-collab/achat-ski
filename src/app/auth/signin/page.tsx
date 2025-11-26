// src/app/auth/signin/page.tsx
"use client";

import { Suspense, FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function SignInInner() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/me";
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const errorMessage =
    localError ||
    (urlError === "CredentialsSignin"
      ? "Email ou mot de passe incorrect."
      : urlError
      ? "Impossible de vous connecter."
      : null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLocalError(null);
    setSubmitting(true);

    try {
      await signIn("credentials", {
        redirect: true,
        email,
        password,
        callbackUrl,
      });
      // Avec redirect: true, NextAuth gère la redirection.
    } catch (err) {
      console.error(err);
      setLocalError("Erreur inattendue lors de la connexion.");
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-ring bg-white p-6 shadow-card">
        <h1 className="text-xl font-semibold text-center mb-1">Connexion</h1>
        <p className="text-xs text-neutral-600 text-center mb-4">
          Connecte-toi pour accéder à ton espace (avis, tests, favoris…)
        </p>

        {errorMessage && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            {errorMessage}
          </p>
        )}

        <form onSubmit={onSubmit} className="grid gap-3">
          <div className="grid gap-1">
            <label className="text-sm font-medium">Email</label>
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
            <label className="text-sm font-medium">Mot de passe</label>
            <input
              type="password"
              required
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn mt-2"
            disabled={submitting}
          >
            {submitting ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p className="mt-4 text-xs text-neutral-600 text-center">
          Pas encore de compte ?{" "}
          <Link
            href={`/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="underline"
          >
            Créer un compte
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[70vh] flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl border border-ring bg-white p-6 shadow-card text-center text-sm text-neutral-600">
            Chargement de la page de connexion…
          </div>
        </main>
      }
    >
      <SignInInner />
    </Suspense>
  );
}
