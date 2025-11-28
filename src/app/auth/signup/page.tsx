// src/app/auth/signup/page.tsx
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUpPage() {
  const router = useRouter();

  const [pseudo, setPseudo] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(true);

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // petite validation client en plus
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("La confirmation du mot de passe ne correspond pas.");
      return;
    }

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
          passwordConfirm,
          optIn: marketingOptIn,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Impossible de créer le compte.");
        setSubmitting(false);
        return;
      }

      // ✅ AUCUNE connexion ici
      // On envoie juste l’utilisateur vers la page "check email"
      const redirectTo: string =
        typeof data?.redirectTo === "string"
          ? data.redirectTo
          : `/auth/check-email?email=${encodeURIComponent(email)}`;

      router.push(redirectTo);
    } catch (err) {
      console.error(err);
      setError("Erreur inattendue lors de la création du compte.");
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
          Inscris-toi pour laisser des avis, des tests et suivre tes contenus.
        </p>

        {error && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}

        <form onSubmit={onSubmit} className="grid gap-3">
          <div className="grid gap-1">
            <label className="text-sm font-medium">Pseudo</label>
            <input
              className="input"
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              placeholder="Nom affiché sur le site"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="grid gap-1">
              <label className="text-sm font-medium">Prénom</label>
              <input
                className="input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">Nom</label>
              <input
                className="input"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
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
            <label className="text-sm font-medium">
              Mot de passe (min. 8 caractères) *
            </label>
            <input
              type="password"
              required
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div className="grid gap-1">
            <label className="text-sm font-medium">
              Confirmation du mot de passe *
            </label>
            <input
              type="password"
              required
              className="input"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <label className="mt-2 flex items-start gap-2 text-xs text-neutral-700">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={marketingOptIn}
              onChange={(e) => setMarketingOptIn(e.target.checked)}
            />
            <span>
              J’accepte de recevoir des emails occasionnels de Meilleur-Ski
              (actualités, nouveautés, bons plans). Je pourrai me désabonner à
              tout moment.
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
          Déjà un compte ?{" "}
          <Link href="/auth/signin" className="underline">
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  );
}
