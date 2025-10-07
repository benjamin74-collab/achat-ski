// src/app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container mx-auto max-w-4xl px-4 py-16">
      <div className="rounded-2xl border p-8 text-center">
        <h1 className="text-3xl font-bold">Page introuvable</h1>
        <p className="mt-3 text-neutral-600">
          Désolé, la page que vous cherchez n’existe pas ou a été déplacée.
        </p>

        <div className="mt-6 flex flex-col items-center gap-3">
          <Link href="/" className="btn">← Retour à l’accueil</Link>
          <Link href="/search" className="text-sm underline">Aller à la recherche</Link>
        </div>
      </div>
    </main>
  );
}

