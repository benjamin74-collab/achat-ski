import Link from "next/link";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-ring">
      <div className="mx-auto max-w-6xl px-4 py-10 grid gap-8 md:grid-cols-4 text-slate-300">
        <div className="col-span-2">
          <Logo />
          <p className="mt-3 text-sm/6 text-slate-400 max-w-md">
            Comparez les prix et trouvez le meilleur équipement de ski au meilleur tarif. Données mises à jour, liens partenaires, avis & tests.
          </p>
        </div>
        <div>
          <div className="font-medium text-white">Catégories</div>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/c/skis-all-mountain" className="hover:text-brand-300">Skis All-Mountain</Link></li>
            <li><Link href="/c/skis-freeride" className="hover:text-brand-300">Skis Freeride</Link></li>
            <li><Link href="/c/skis-rando" className="hover:text-brand-300">Skis Rando</Link></li>
            <li><Link href="/c/fixations" className="hover:text-brand-300">Fixations</Link></li>
            <li><Link href="/c/chaussures" className="hover:text-brand-300">Chaussures</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-medium text-white">À propos</div>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/a/propos" className="hover:text-brand-300">Qui sommes-nous</Link></li>
            <li><Link href="/a/contact" className="hover:text-brand-300">Contact</Link></li>
            <li><Link href="/a/confidentialite" className="hover:text-brand-300">Confidentialité</Link></li>
          </ul>
        </div>
      </div>
      <div className="text-center text-xs text-slate-500 pb-6">
        © {new Date().getFullYear()} Meilleur-ski. Certains liens sont affiliés.
      </div>
    </footer>
  );
}
