// src/app/a-propos/page.tsx
import { getSiteConfig } from "@/config/site";

export const revalidate = 86400;

export default function AboutPage() {
  const site = getSiteConfig();
  const host = new URL(site.domain).hostname;
  const contactEmail = `contact@${host}`;

  const isRobot = site.id === "meilleur-robot";

  return (
    <div className="container-page py-10">
      <h1 className="text-2xl font-bold">À propos</h1>

      <p className="mt-3 text-neutral-700 max-w-2xl">
        <strong>{host}</strong> est un comparateur de prix et un site de contenus (guides, sélections, avis) dédié{" "}
        {isRobot ? "aux robots du quotidien" : "au matériel de ski"}. Nous agrégeons les offres de marchands partenaires
        et redirigeons vers leur site pour finaliser l’achat.
      </p>

      <ul className="mt-6 list-disc pl-6 text-neutral-700 space-y-2 max-w-2xl">
        <li>Certains liens peuvent être affiliés (rémunération à la vente), sans surcoût pour vous.</li>
        <li>Les prix et disponibilités peuvent évoluer rapidement chez les marchands.</li>
        <li>
          Pour toute question : <strong>{contactEmail}</strong>
        </li>
      </ul>
    </div>
  );
}
