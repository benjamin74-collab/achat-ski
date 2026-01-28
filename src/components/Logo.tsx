// src/components/Logo.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type LogoData = {
  name: string;
  tagline: string;
  logoSrc: string;
};

function readLogoDataFromHtml(): LogoData {
  if (typeof document === "undefined") {
    return { name: "Meilleur Ski", tagline: "Comparer & gagner", logoSrc: "" };
  }
  const el = document.documentElement;
  return {
    name: el.dataset.siteName || "Meilleur Ski",
    tagline: el.dataset.siteTagline || "Comparer & gagner",
    logoSrc: el.dataset.siteLogo || "",
  };
}

export default function Logo({ asLink = true }: { asLink?: boolean }) {
  const [data, setData] = useState<LogoData>(() => readLogoDataFromHtml());

  // ✅ Au cas où le DOM est prêt après hydration (sécurité)
  useEffect(() => {
    setData(readLogoDataFromHtml());
  }, []);

  const Mark = (
    <div className="flex items-center gap-2">
      {data.logoSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={data.logoSrc}
          alt={data.name}
          className="h-8 w-8 rounded-xl object-contain bg-white"
          loading="eager"
          decoding="async"
        />
      ) : (
        <div className="size-8 rounded-xl brand-gradient" />
      )}

      <div className="leading-tight">
        <div className="text-white font-extrabold tracking-tight text-lg">{data.name}</div>
        <div className="text-brand-300 text-[10px] uppercase tracking-wider">{data.tagline}</div>
      </div>
    </div>
  );

  if (!asLink) return Mark;

  return (
    <Link href="/" className="hover:opacity-90 no-underline hover:no-underline" aria-label={`${data.name} — Accueil`}>
      {Mark}
    </Link>
  );
}
