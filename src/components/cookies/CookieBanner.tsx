"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CONSENT_COOKIE, CONSENT_MAX_AGE, CONSENT_VERSION, type Consent } from "@/lib/consent";

const LS_KEY = "ms_consent_v1";

function readConsentClient(): Consent | null {
  try {
    const v = localStorage.getItem(LS_KEY);
    if (v === "essential" || v === "all") return v;
    return null;
  } catch {
    return null;
  }
}

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  document.cookie = `${name}=${value}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;
}

async function logConsent(choice: Consent) {
  try {
    const path = window.location.pathname;
    await fetch(`/api/consent?path=${encodeURIComponent(path)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ choice }),
      keepalive: true,
    });
  } catch {
    // ignore
  }
}

export default function CookieBanner() {
  const [open, setOpen] = useState(false);

  const shouldShow = useMemo(() => {
    const existing = readConsentClient();
    return !existing;
  }, []);

  useEffect(() => {
    setOpen(shouldShow);

    const onOpen = () => setOpen(true);
    window.addEventListener("cookie-consent-open", onOpen);
    return () => window.removeEventListener("cookie-consent-open", onOpen);
  }, [shouldShow]);

  if (!open) return null;

  const accept = async (choice: Consent) => {
    try {
      localStorage.setItem(LS_KEY, choice);
      localStorage.setItem(`${LS_KEY}_ts`, String(Date.now()));
      localStorage.setItem(`${LS_KEY}_ver`, CONSENT_VERSION);
    } catch {
      // ignore
    }
    setCookie(CONSENT_COOKIE, choice, CONSENT_MAX_AGE);
    window.dispatchEvent(new CustomEvent("cookie-consent-changed", { detail: choice }));
    void logConsent(choice);
    setOpen(false);
  };

  return (
    <div className="fixed left-4 bottom-4 z-[9999] w-[min(420px,calc(100vw-2rem))]">
      <div className="rounded-2xl border bg-white shadow-xl overflow-hidden">
        <div className="p-4">
          <div className="text-sm font-semibold">🍪 Gestion des cookies</div>

          <p className="mt-2 text-sm text-neutral-700 leading-relaxed">
            Nous utilisons des cookies <b>essentiels</b> au bon fonctionnement du site. Avec votre accord,
            nous pouvons également utiliser des cookies <b>optionnels</b> (mesure d’audience, personnalisation,
            publicité) pour améliorer votre expérience et financer le service. Vous pouvez modifier votre choix
            à tout moment.
          </p>

          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-neutral-50 transition"
              onClick={() => accept("essential")}
            >
              Essentiels seulement
            </button>

            <button
              type="button"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-95 transition"
              style={{ backgroundColor: "rgb(var(--primary))" }}
              onClick={() => accept("all")}
            >
              Tout accepter
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <Link href="/politique-cookies" className="text-xs text-neutral-600 hover:underline">
              En savoir plus / Politique cookies
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-neutral-500 hover:underline"
              aria-label="Fermer"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}