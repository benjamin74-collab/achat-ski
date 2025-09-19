import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page py-16 text-center">
      <h1 className="text-4xl font-extrabold">Page introuvable</h1>
      <p className="mt-3 text-neutral-600">La page demandée n’existe pas ou plus.</p>
      <div className="mt-6">
        <Link href="/" className="btn">Retour à l’accueil</Link>
      </div>
    </div>
  );
}
