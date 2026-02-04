"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type RuntimeBrand = {
  siteName: string;
  tagline: string;
  logoSrc?: string;
  logoAlt?: string;
};

export default function Logo({ asLink = true }: { asLink?: boolean }) {
  const [brand, setBrand] = useState<RuntimeBrand>({
    siteName: "Meilleur",
    tagline: "",
    logoSrc: undefined,
    logoAlt: undefined,
  });

  useEffect(() => {
    const el = document.documentElement;
    const siteName = el.dataset.siteName || "Meilleur";
    const tagline = el.dataset.siteTagline || "";
    const logoSrc = el.dataset.siteLogo || undefined;
    const logoAlt = el.dataset.siteLogoAlt || siteName;

    setBrand({ siteName, tagline, logoSrc, logoAlt });
  }, []);

  const Mark = (
    <div className="flex items-center gap-2">
      {/* Logo fichier si dispo, sinon fallback carré gradient */}
      {brand.logoSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={brand.logoSrc}
          alt={brand.logoAlt || brand.siteName}
          className="h-9 w-auto max-w-[160px] object-contain"
          loading="eager"
          decoding="async"
        />
      ) : (
        <div className="size-8 rounded-xl brand-gradient" />
      )}

      <div className="leading-tight">
        <div className="text-ink font-extrabold tracking-tight text-lg">
          {brand.siteName}
        </div>
        {brand.tagline ? (
          <div className="text-brand-600 text-[10px] uppercase tracking-wider">
            {brand.tagline}
          </div>
        ) : null}
      </div>
    </div>
  );

  if (!asLink) return Mark;

  return (
    <Link href="/" className="hover:opacity-90 no-underline hover:no-underline" aria-label={`${brand.siteName} — Accueil`}>
      {Mark}
    </Link>
  );
}
