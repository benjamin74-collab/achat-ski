// src/components/cookies/CookieBanner.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getConsentClient, setConsentClient, type Consent } from "@/lib/consent";

export default function CookieBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const c = getConsentClient();
    setOpen(c == null);
  }, []);

  function choose(v: Consent) {
    setConsentClient(v);
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[60] w-[min(420px,calc(100vw-2rem))]">
      <div className="rounded-2xl border border-ring bg-white shadow-card p-4">
        <div className="text-sm font-semibold text-ink">Gestion des cookies</div>

        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          Nous utilisons des cookies essentiels au bon fonctionnement du site. Avec votre accord, nous
          pouvons aussi utiliser des cookies de mesure d’audience et de personnalisation afin d’améliorer
          votre expérience.
        </p>

        <p className="mt-2 text-xs text-slate-500">
          En savoir plus :{" "}
          <Link href="/politique-cookies" className="underline hover:text-slate-700">
            politique cookies
          </Link>
        </p>

        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            className="btn-outline w-full justify-center"
            onClick={() => choose("essential")}
          >
            Essentiels uniquement
          </button>

          <button
            type="button"
            className="btn w-full justify-center"
            onClick={() => choose("all")}
          >
            Tout accepter
          </button>
        </div>

        <div className="mt-2 text-[11px] text-slate-400">
          Vous pourrez modifier votre choix à tout moment depuis la politique cookies.
        </div>
      </div>
    </div>
  );
}