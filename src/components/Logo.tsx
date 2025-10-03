// src/components/Logo.tsx
import Link from "next/link";

export default function Logo({ withDotCom = false, className = "" }: { withDotCom?: boolean; className?: string }) {
  const label = withDotCom ? "Meilleur-ski.com" : "Meilleur-ski";
  return (
    <Link href="/" aria-label="Accueil — Meilleur-ski" className={`inline-flex items-center gap-2 ${className}`}>
      <svg width="28" height="28" viewBox="0 0 48 48" className="shrink-0">
        <defs>
          <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#6E68FF"/>
            <stop offset="1" stopColor="#00D2A8"/>
          </linearGradient>
        </defs>
        <rect x="4" y="6" width="40" height="36" rx="10" fill="url(#g1)"/>
        {/* sommet stylisé */}
        <path d="M10 32 L20 18 L26 24 L34 16 L38 20 L40 32 Z" fill="#fff" opacity=".95"/>
      </svg>
      <span className="text-lg font-extrabold tracking-tight text-white">{label}</span>
    </Link>
  );
}
