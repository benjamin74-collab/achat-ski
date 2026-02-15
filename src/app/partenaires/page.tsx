// src/app/partenaires/page.tsx
import { getSiteConfig } from "@/config/site";

export const revalidate = 3600;

export default function PartnersPage() {
  const site = getSiteConfig();
  const host = new URL(site.domain).hostname;
  const contactEmail = `contact@${host}`;

  const isRobot = site.id === "meilleur-robot";

  return (
    <main className="container-page py-8">
      <h1 className="text-2xl font-bold">Marchands & partenaires</h1>

      <div className="mt-4 space-y-3 text-neutral-700 max-w-2xl">
        <p>
          Vous souhaitez apparaître sur <strong>{host}</strong> ?
        </p>
        <p>
          Nous pouvons intégrer des flux produits/offres, des partenariats d’affiliation, ou des collaborations éditoriales
          (guides, comparatifs, tests).
        </p>
        <p>
          {isRobot
            ? "Domaines typiques : robots aspirateurs, cuisine, tondeuse, piscine, lave-vitres…"
            : "Domaines typiques : skis, chaussures, fixations, textile, accessoires…"}
        </p>

        <p>
          Contact : <strong>{contactEmail}</strong>
        </p>
      </div>
    </main>
  );
}
