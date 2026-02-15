// src/app/cgu/page.tsx
import { getSiteConfig } from "@/config/site";

export const revalidate = 86400;

export default function CguPage() {
  const site = getSiteConfig();
  const host = new URL(site.domain).hostname;
  const contactEmail = `contact@${host}`;

  return (
    <main className="container-page py-8">
      <h1 className="text-2xl font-bold">Conditions Générales d’Utilisation</h1>

      <div className="mt-4 space-y-3 text-neutral-700 max-w-2xl">
        <p>
          <strong>Éditeur :</strong> {host}
        </p>
        <p>
          <strong>Contact :</strong> {contactEmail}
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
