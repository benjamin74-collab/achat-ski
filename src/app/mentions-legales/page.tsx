"use client";

import { useEffect, useMemo, useState } from "react";

type MentionsPack = {
  metaTitle: string;
  editor: string;
  contactEmail: string;
};

const MENTIONS: Record<string, MentionsPack> = {
  "meilleur-ski": {
    metaTitle: "Mentions légales — Meilleur-Ski",
    editor: "Meilleur-Ski.com",
    contactEmail: "contact@meilleur-ski.com",
  },
  "meilleur-robot": {
    metaTitle: "Mentions légales — Meilleur-Robot",
    editor: "Meilleur-Robot.com",
    contactEmail: "contact@meilleur-robot.com",
  },
  // fallback compat ancien domaine
  "achat-ski": {
    metaTitle: "Mentions légales — Achat-Ski",
    editor: "Achat-Ski.com",
    contactEmail: "contact@achat-ski.com",
  },
};

export default function MentionsPage() {
  const [siteId, setSiteId] = useState<string>("meilleur-ski");

  useEffect(() => {
    const id = document.documentElement.dataset.siteId;
    if (id) setSiteId(id);
  }, []);

  const pack = useMemo(() => MENTIONS[siteId] ?? MENTIONS["meilleur-ski"], [siteId]);

  // ✅ Title côté client (simple & efficace)
  useEffect(() => {
    document.title = pack.metaTitle;
  }, [pack.metaTitle]);

  return (
    <div className="container-page py-10">
      <h1 className="text-2xl font-bold">Mentions légales</h1>

      <div className="mt-4 space-y-3 text-neutral-700 max-w-2xl">
        <p>
          <strong>Éditeur :</strong> {pack.editor}
        </p>
        <p>
          <strong>Contact :</strong> {pack.contactEmail}
        </p>
        <p>
          <strong>Hébergement :</strong> Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA
        </p>
        <p>
          <strong>Responsabilité :</strong> Les informations (prix, stock) sont fournies à titre indicatif et peuvent
          varier chez les marchands.
        </p>
      </div>
    </div>
  );
}
