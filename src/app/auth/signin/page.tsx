"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type SiteCopy = {
  title: string;
  description: string;
  bullets: string[];
};

function getSiteSlugFromHost(host: string) {
  const h = host.toLowerCase();

  if (h.includes("meilleur-robot")) return "meilleur-robot";
  if (h.includes("meilleur-ski") || h.includes("achat-ski")) return "meilleur-ski";

  // fallback : si tu ajoutes d'autres domaines plus tard
  return "meilleur-ski";
}

const COPY_BY_SITE: Record<string, SiteCopy> = {
  "meilleur-ski": {
    title: "Nouveau sur Meilleur-Ski ?",
    description:
      "Crée ton compte pour laisser des avis, proposer des tests de matériel, suivre tes contenus favoris et profiter d’une expérience personnalisée.",
    bullets: [
      "• Laisser des avis sur les skis et chaussures",
      "• Suivre tes tests et leur statut de publication",
      "• Sauvegarder des produits pour plus tard",
    ],
  },
  "meilleur-robot": {
    title: "Nouveau sur Meilleur-Robot ?",
    description:
      "Crée ton compte pour laisser des avis, proposer des tests de robots, suivre tes comparatifs favoris et profiter d’une expérience personnalisée.",
    bullets: [
      "• Laisser des avis sur les robots aspirateurs et tondeuses",
      "• Suivre tes tests et leur statut de publication",
      "• Sauvegarder des produits pour plus tard",
    ],
  },
};

export default function SignInPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";
  const urlError = searchParams.get("error");

  const [siteSlug, setSiteSlug] = useState<string>("meilleur-ski");

  useEffect(() => {
    // Côté client uniquement
    const host = window.location.host || "";
    setSiteSlug(getSiteSlugFromHost(host));
  }, []);

  const copy = useMemo(() => {
    return COPY_BY_SITE[siteSlug] ?? COPY_BY_SITE["meilleur-ski"];
  }, [siteSlug]);

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
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-10 bg-surface">
      <div className="w-full max-w-4xl rounded-2xl border border-ring bg-white shadow-card overflow-hidden">
        <div className="grid md:grid-cols-2">
          {/* Colonne gauche : Connexion */}
          <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-border">
            <h1 className="text-xl font-semibold mb-1 text-center md:text-left">
              Connexion
            </h1>
            <p className="text-xs text-neutral-600 mb-4 text-center md:text-left">
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
                className="btn mt-2 w-full"
                disabled={submitting}
              >
                {submitting ? "Connexion..." : "Se connecter"}
              </button>
            </form>
          </div>

          {/* Colonne droite : Création de compte (dynamique) */}
          <div className="p-6 md:p-8 bg-slate-900 text-slate-50 flex flex-col justify-center">
            <h2 className="text-lg font-semibold mb-2">{copy.title}</h2>

            <p className="text-sm text-slate-200 mb-4">{copy.description}</p>

            <ul className="text-xs text-slate-200 space-y-1 mb-5">
              {copy.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>

            <Link
              href={`/auth/signup?callbackUrl=${encodeURIComponent(
                callbackUrl
              )}`}
              className="btn w-full md:w-auto bg-white text-slate-900 hover:bg-slate-100"
            >
              Créer un compte
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
