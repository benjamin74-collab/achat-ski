// src/app/faq/page.tsx
import { getSiteConfig } from "@/config/site";

export const revalidate = 3600;

export default function FAQPage() {
  const site = getSiteConfig();
  const host = new URL(site.domain).hostname;

  return (
    <main className="container-page py-8">
      <h1 className="text-2xl font-bold">FAQ</h1>

      <ul className="mt-4 space-y-3 max-w-3xl">
        <li className="card p-4">
          <b>Comment fonctionnent les prix ?</b>
          <div className="mt-1 text-neutral-700">
            Nous agrégeons des offres de marchands partenaires. Les prix peuvent évoluer (promotions, stock, frais de
            livraison) : le prix final est celui affiché chez le marchand au moment de l’achat.
          </div>
        </li>

        <li className="card p-4">
          <b>Pourquoi certains liens sont affiliés ?</b>
          <div className="mt-1 text-neutral-700">
            Certains liens peuvent être affiliés : si vous achetez après avoir cliqué, nous pouvons percevoir une
            commission. Cela ne change pas le prix pour vous et aide à financer {host}.
          </div>
        </li>

        <li className="card p-4">
          <b>Comment sont sélectionnés les produits et contenus ?</b>
          <div className="mt-1 text-neutral-700">
            Nous combinons des données catalogue (offres, caractéristiques) avec des contenus éditoriaux (guides,
            comparatifs) afin de vous aider à choisir plus vite.
          </div>
        </li>

        <li className="card p-4">
          <b>Je vois une erreur (prix, stock, fiche produit). Que faire ?</b>
          <div className="mt-1 text-neutral-700">
            Les données peuvent être mises à jour avec un léger délai. Si le problème persiste, contactez-nous via la page
            Contact.
          </div>
        </li>
      </ul>
    </main>
  );
}
