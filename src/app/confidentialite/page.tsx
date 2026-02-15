// src/app/confidentialite/page.tsx
import { getSiteConfig } from "@/config/site";

export const revalidate = 86400;

export default function PrivacyPage() {
  const site = getSiteConfig();
  const contactEmail = `contact@${new URL(site.domain).hostname}`;

  return (
    <main className="container-page py-8">
      <h1 className="text-2xl font-bold">Confidentialité</h1>

      <div className="mt-4 space-y-3 text-neutral-700 max-w-2xl">
        <p>
          Cette page décrit comment <strong>{site.name}</strong> peut collecter et utiliser certaines données
          (navigation, formulaires) afin d’améliorer l’expérience et mesurer l’audience.
        </p>

        <p>
          <strong>Données collectées :</strong> informations saisies dans les formulaires (ex : email),
          données de navigation et mesures d’audience.
        </p>

        <p>
          <strong>Finalités :</strong> fonctionnement du service, amélioration du site, statistiques,
          et éventuellement communications si vous y consentez.
        </p>

        <p>
          <strong>Contact :</strong> {contactEmail}
        </p>

        <p className="text-sm text-neutral-500">
          (Contenu à compléter : durée de conservation, sous-traitants, droits RGPD, etc.)
        </p>
      </div>
    </main>
  );
}
