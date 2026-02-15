// src/app/cookies/page.tsx
import { getSiteConfig } from "@/config/site";

export const revalidate = 86400;

export default function CookiesPage() {
  const site = getSiteConfig();
  const contactEmail = `contact@${new URL(site.domain).hostname}`;

  return (
    <main className="container-page py-8">
      <h1 className="text-2xl font-bold">Cookies</h1>

      <div className="mt-4 space-y-3 text-neutral-700 max-w-2xl">
        <p>
          <strong>{site.name}</strong> peut utiliser des cookies et technologies similaires pour assurer le bon
          fonctionnement du site, mesurer l’audience et améliorer l’expérience utilisateur.
        </p>

        <p>
          <strong>Gestion des cookies :</strong> vous pouvez limiter ou bloquer les cookies via les paramètres de votre
          navigateur.
        </p>

        <p>
          <strong>Contact :</strong> {contactEmail}
        </p>

        <p className="text-sm text-neutral-500">
          (Contenu à compléter : liste des cookies, durée, finalités, consentement, etc.)
        </p>
      </div>
    </main>
  );
}
