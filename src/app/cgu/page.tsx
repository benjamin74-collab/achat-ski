"use client";

import { useEffect, useMemo, useState } from "react";

type CGUPack = {
  title: string;
  editor: string;
  contactEmail: string;
};

const CGU: Record<string, CGUPack> = {
  "meilleur-ski": {
    title: "CGU — Meilleur-Ski",
    editor: "Meilleur-Ski.com",
    contactEmail: "contact@meilleur-ski.com",
  },
  "meilleur-robot": {
    title: "CGU — Meilleur-Robot",
    editor: "Meilleur-Robot.com",
    contactEmail: "contact@meilleur-robot.com",
  },
  "achat-ski": {
    title: "CGU — Achat-Ski",
    editor: "Achat-Ski.com",
    contactEmail: "contact@achat-ski.com",
  },
};

export default function CguPage() {
  const [siteId, setSiteId] = useState<string>("meilleur-ski");

  useEffect(() => {
    const id = document.documentElement.dataset.siteId;
    if (id) setSiteId(id);
  }, []);

  const pack = useMemo(() => CGU[siteId] ?? CGU["meilleur-ski"], [siteId]);

  useEffect(() => {
    document.title = pack.title;
  }, [pack.title]);

  return (
    <main className="container-page py-8">
      <h1 className="text-2xl font-bold">Conditions Générales d’Utilisation</h1>

      <div className="mt-4 space-y-3 text-neutral-700 max-w-2xl">
        <p>
          <strong>Éditeur :</strong> {pack.editor}
        </p>
        <p>
          <strong>Contact :</strong> {pack.contactEmail}
        </p>

        <p>
          Le site propose des contenus (guides, comparatifs, avis) et des liens vers des offres de marchands partenaires.
          Certains liens peuvent être affiliés.
        </p>

        <p>
          <strong>Responsabilité :</strong> les prix, stocks et informations affichés peuvent évoluer chez les marchands.
          Les décisions d’achat relèvent de l’utilisateur.
        </p>

        <p className="text-sm text-neutral-500">
          (Contenu à compléter : propriété intellectuelle, modération des avis, disponibilité du service, droit applicable,
          etc.)
        </p>
      </div>
    </main>
  );
}
