"use client";

import { useState } from "react";

export default function MerchantLogo({ slug, name }: { slug: string; name: string }) {
  const [showImg, setShowImg] = useState(true);
  const srcSvg = `/logos/${slug}.svg`;
  const srcPng = `/logos/${slug}.png`;

  return (
    <div className="flex items-center gap-2">
      {showImg && (
        <img
          src={srcSvg}
          srcSet={`${srcSvg} 1x, ${srcPng} 1x`}
          alt={`${name} logo`}
          className="h-5 w-auto"
          onError={() => setShowImg(false)}
        />
      )}
      <span className="truncate">{name}</span>
    </div>
  );
}
