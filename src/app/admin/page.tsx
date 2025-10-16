// src/app/admin/page.tsx
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role ?? "USER";

  if (!session || role !== "ADMIN") {
    // Pas d’accès si non-admin
    return notFound();
  }

  return (
    <main className="py-6">
      <h1 className="text-2xl font-semibold">Administration</h1>
      <p className="mt-2 text-slate-600">
        Gestion des contenus et modération.
      </p>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        <li className="card p-4">
          <h2 className="font-semibold">Avis</h2>
          <p className="text-sm text-slate-600">Créer, lister, modérer les avis.</p>
          <Link className="btn mt-3 inline-flex" href="/admin/reviews">Aller aux avis</Link>
        </li>
        <li className="card p-4">
          <h2 className="font-semibold">Tests</h2>
          <p className="text-sm text-slate-600">Créer, lister, modérer les tests éditoriaux.</p>
          <Link className="btn mt-3 inline-flex" href="/admin/tests">Aller aux tests</Link>
        </li>
        <li className="card p-4">
          <h2 className="font-semibold">Catégories</h2>
          <p className="text-sm text-slate-600">Créer / éditer les pages catégorie (texte + SEO).</p>
          <Link className="btn mt-3 inline-flex" href="/admin/categories">Gérer les catégories</Link>
        </li>
      </ul>
    </main>
  );
}
