// src/app/contact/page.tsx
import { getSiteConfig } from "@/config/site";

export const revalidate = 3600;

export default function ContactPage() {
  const site = getSiteConfig();
  const host = new URL(site.domain).hostname;
  const contactEmail = `contact@${host}`;

  return (
    <main className="container-page py-8">
      <h1 className="text-2xl font-bold">Contact</h1>

      <div className="mt-4 space-y-2 text-neutral-700 max-w-2xl">
        <p>
          Une question, un bug, une demande partenaire ?
        </p>
        <p>
          Écrivez-nous : <strong>{contactEmail}</strong>
        </p>
      </div>
    </main>
  );
}
