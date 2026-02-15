"use client";

import { useEffect, useMemo, useState } from "react";

export const revalidate = 86400;

type PrivacyPack = {
  title: string;
  intro: string;
  contactEmail: string;
};

const PRIVACY: Record<string, PrivacyPack> = {
  "meilleur-ski": {
    title: "Confidentialité — Meilleur-Ski",
    intro:
      "Cette page décrit comment Meilleur-Ski collecte et utilise certaines données (navigation, formulaires) pour améliorer l’expérience et mesurer l’audience.",
    contactEmail: "contact@meilleur-ski.com",
  },
  "meilleur-robot": {
    title: "Confidentialité — Meilleur-Robot",
    intro:
      "Cette page décrit comment Meilleur-Robot collecte et utilise certaines données (navigation, formulaires) pour améliorer l’expérience et mesurer l’audience.",
    contactEmail: "contact@meilleur-robot.com",
  },
  "achat-ski": {
    title: "Confidentialité — Achat-Ski",
    intro:
      "Cette page décrit comment Achat-Ski collecte et utilise certaines données (navigation, formulaires) pour améliorer l’expérience et mesurer l’audience.",
    contactEmail: "contact@achat-ski.com",
  },
};

export default function PrivacyPage() {
  const [siteId, setSiteId] = useState<string>("meilleur-ski");

  useEffect(() => {
    const id = document.documentElement.dataset.siteId;
    if (id) setSiteId(id);
  }, []);

  const pack = useMemo(() => PRIVACY[siteId] ?? PRIVACY["meilleur-ski"], [siteId]);

  useEffect(() => {
    document.title = pack.title;
  }, [pack.title]);

  return (
    <main className="container-page py-8">
      <h1 className="text-2xl font-bold">Confidentialité</h1>

      <div className="mt-4 space-y-3 text-neutral-700 max-w-2xl">
        <p>{pack.intro}</p>

        <p>
          <strong>Données collectées :</strong> informations saisies dans les formulaires (ex : email), données de
          navigation et mesures d’audience.
        </p>

        <p>
          <strong>Finalités :</strong> fonctionnement du service, amélioration du site, statistiques, et éventuellement
          communications si vous y consentez.
        </p>

        <p>
          <strong>Contact :</strong> {pack.contactEmail}
        </p>

        <p className="text-sm text-neutral-500">
          (Contenu à compléter : durée de conservation, sous-traitants, droits RGPD, etc.)
        </p>
      </div>
    </main>
  );
}
