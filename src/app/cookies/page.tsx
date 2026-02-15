"use client";

import { useEffect, useMemo, useState } from "react";

type CookiesPack = {
  title: string;
  contactEmail: string;
};

const COOKIES: Record<string, CookiesPack> = {
  "meilleur-ski": {
    title: "Cookies — Meilleur-Ski",
    contactEmail: "contact@meilleur-ski.com",
  },
  "meilleur-robot": {
    title: "Cookies — Meilleur-Robot",
    contactEmail: "contact@meilleur-robot.com",
  },
  "achat-ski": {
    title: "Cookies — Achat-Ski",
    contactEmail: "contact@achat-ski.com",
  },
};

export default function CookiesPage() {
  const [siteId, setSiteId] = useState<string>("meilleur-ski");

  useEffect(() => {
    const id = document.documentElement.dataset.siteId;
    if (id) setSiteId(id);
  }, []);

  const pack = useMemo(() => COOKIES[siteId] ?? COOKIES["meilleur-ski"], [siteId]);

  useEffect(() => {
    document.title = pack.title;
  }, [pack.title]);

  return (
    <main className="container-page py-8">
      <h1 className="text-2xl font-bold">Cookies</h1>

      <div className="mt-4 space-y-3 text-neutral-700 max-w-2xl">
        <p>
          Nous utilisons des cookies et technologies similaires pour assurer le bon fonctionnement du site, mesurer
          l’audience et améliorer l’expérience utilisateur.
        </p>

        <p>
          <strong>Gestion des cookies :</strong> vous pouvez limiter ou bloquer les cookies via les paramètres de votre
          navigateur.
        </p>

        <p>
          <strong>Contact :</strong> {pack.contactEmail}
        </p>

        <p className="text-sm text-neutral-500">
          (Contenu à compléter : liste des cookies, durée, finalités, consentement, etc.)
        </p>
      </div>
    </main>
  );
}
