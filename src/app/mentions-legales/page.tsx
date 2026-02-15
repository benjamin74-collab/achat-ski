// src/app/mentions-legales/page.tsx
import { getSiteConfig } from "@/config/site";

export const revalidate = 86400;

export default function MentionsPage() {
  const site = getSiteConfig();
  const host = new URL(site.domain).hostname;
  const contactEmail = `contact@${host}`;

  return (
    <div className="container-page py-10">
      <h1 className="text-2xl font-bold">Mentions légales</h1>

      <div className="mt-4 space-y-3 text-neutral-700 max-w-2xl">
        <p>
          <strong>Éditeur :</strong> {host}
        </p>
        <p>
          <strong>Contact :</strong> {contactEmail}
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
