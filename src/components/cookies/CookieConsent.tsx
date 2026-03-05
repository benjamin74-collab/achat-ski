"use client";

import { useEffect, useState } from "react";

type ConsentValue = "essential" | "all";

const KEY = "ms_cookie_consent_v1";

function readConsent(): ConsentValue | null {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "essential" || v === "all") return v;
    return null;
  } catch {
    return null;
  }
}

function writeConsent(v: ConsentValue) {
  try {
    localStorage.setItem(KEY, v);
    localStorage.setItem(KEY + "_ts", String(Date.now()));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent("cookie-consent-changed", { detail: v }));
}

export function getConsentClient(): ConsentValue | null {
  return readConsent();
}

export default function CookieConsent() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const existing = readConsent();
    setOpen(!existing);

    const onOpen = () => setOpen(true);
    window.addEventListener("cookie-consent-open", onOpen);

    return () => window.removeEventListener("cookie-consent-open", onOpen);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed left-4 bottom-4 z-[9999] w-[min(420px,calc(100vw-2rem))]">
      <div className="rounded-2xl border bg-white shadow-xl overflow-hidden">
        <div className="p-4">
          <div className="text-sm font-semibold">Gestion des cookies</div>
          <p className="mt-2 text-sm text-neutral-700 leading-relaxed">
            Nous utilisons des cookies essentiels au bon fonctionnement du site. Avec votre accord,
            nous pouvons également utiliser des cookies optionnels (mesure d’audience, personnalisation,
            publicité) afin d’améliorer votre expérience. Vous pouvez modifier votre choix à tout moment.
          </p>

          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-neutral-50 transition"
              onClick={() => {
                writeConsent("essential");
                setOpen(false);
              }}
            >
              Essentiels seulement
            </button>

            <button
              type="button"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-white hover:brightness-95 transition"
              style={{ backgroundColor: "rgb(var(--primary))" }}
              onClick={() => {
                writeConsent("all");
                setOpen(false);
              }}
            >
              Tout accepter
            </button>
          </div>

          <button
            type="button"
            className="mt-3 text-xs text-neutral-600 hover:underline"
            onClick={() => {
              // pour la V2 : ouvrir un vrai centre de préférences
              window.location.href = "/politique-cookies";
            }}
          >
            En savoir plus / Politique cookies
          </button>
        </div>
      </div>
    </div>
  );
}