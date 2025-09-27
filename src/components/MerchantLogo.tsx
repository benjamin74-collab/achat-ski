"use client";
import { useState } from "react";

export default function MerchantLogo({ slug, name }: { slug: string; name: string }) {
  const [error, setError] = useState(false);
  const srcSvg = `/logos/${slug}.svg`;
  const srcPng = `/logos/${slug}.png`;

  if (error) {
    return <span className="font-medium">{name}</span>;
  }

  return (
    <img
      src={srcSvg}
      srcSet={`${srcSvg} 1x, ${srcPng} 1x`}
      alt={`${name} logo`}
      className="h-5 w-auto"
      onError={() => setError(true)}
    />
  );
}
