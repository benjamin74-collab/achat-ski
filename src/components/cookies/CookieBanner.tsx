// src/components/cookies/CookieBanner.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getConsentClient, setConsentClient, type Consent } from "@/lib/consent";

export default function CookieBanner({ disabled = false }: { disabled?: boolean }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (disabled) {
      setOpen(false);
      return;
    }

    const consent = getConsentClient();
    setOpen(consent == null);
  }, [disabled]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  function choose(value: Consent) {
    setConsentClient(value);
    setOpen(false);

    void fetch(`/api/consent?path=${encodeURIComponent(window.location.pathname)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        choice: value,
      }),
      keepalive: true,
    }).catch(() => {
      // Le consentement local reste prioritaire.
      // L'échec du log serveur ne doit pas bloquer l'utilisateur.
    });
  }

  if (disabled || !open) {
    return null;
  }

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-banner-title"
        aria-describedby="cookie-banner-description"
        className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6"
      >
        <div className="flex items-start gap-4">
          <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-xl sm:flex">
            🍪
          </div>

          <div>
            <h2
              id="cookie-banner-title"
              className="text-lg font-black tracking-tight text-slate-950"
            >
              Gestion des cookies
            </h2>

            <p
              id="cookie-banner-description"
              className="mt-2 text-sm leading-6 text-slate-600"
            >
              Nous utilisons des cookies essentiels au bon fonctionnement du site. Avec votre
              accord, nous pouvons aussi utiliser des cookies de mesure d’audience et de
              personnalisation afin d’améliorer votre expérience.
            </p>

            <p className="mt-3 text-xs leading-5 text-slate-500">
              Vous pouvez accepter ou refuser les cookies non essentiels. Votre choix pourra être
              modifié à tout moment depuis la{" "}
              <Link href="/politique-cookies" className="font-semibold underline hover:text-slate-700">
                politique cookies
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50"
            onClick={() => choose("essential")}
          >
            Refuser
          </button>

          <button
            type="button"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700"
            onClick={() => choose("all")}
          >
            Tout accepter
          </button>
        </div>
      </div>
    </div>
  );
}