"use client";

import { useEffect } from "react";

export default function AdsenseScript({ client }: { client: string }) {
  useEffect(() => {
    if (!client) return;

    const existing = document.querySelector('script[data-adsense="1"]');
    if (existing) return;

    const s = document.createElement("script");
    s.async = true;
    s.dataset.adsense = "1";
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
    s.crossOrigin = "anonymous";
    document.head.appendChild(s);
  }, [client]);

  return null;
}