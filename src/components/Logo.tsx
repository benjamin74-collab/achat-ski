"use client";
import Link from "next/link";

export default function Logo({ asLink = true }: { asLink?: boolean }) {
  const Mark = (
    <div className="flex items-center gap-2">
      <div className="size-8 rounded-xl brand-gradient" />
      <div className="leading-tight">
        <div className="text-white font-extrabold tracking-tight text-lg">Meilleur&nbsp;Ski</div>
        <div className="text-brand-300 text-[10px] uppercase tracking-wider">Comparer & gagner</div>
      </div>
    </div>
  );
  if (!asLink) return Mark;
  return (
    <Link href="/" className="hover:opacity-90" aria-label="Meilleur Ski — Accueil">
      {Mark}
    </Link>
  );
}
