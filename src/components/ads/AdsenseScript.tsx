"use client";

import { useEffect } from "react";
import { getConsentClient } from "@/lib/consent";

export default function AdsenseScript({ client }: { client: string }) {
  useEffect(() => {
    if (!client) return;

    const consent = getConsentClient();
    if (consent !== "all") return;

    // évite doublons
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