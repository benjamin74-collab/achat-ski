"use client";

import { useEffect } from "react";
import { getConsentClient } from "@/lib/consent";

type Props = {
  client: string;
  slot: string;
  className?: string;
};

export default function AdsenseUnit({ client, slot, className }: Props) {
  useEffect(() => {
    const consent = getConsentClient();
    if (consent !== "all") return;

    try {
      // @ts-expect-error adsbygoogle global
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // ignore
    }
  }, [client, slot]);

  if (!client || !slot) return null;

  return (
    <ins
      className={`adsbygoogle ${className ?? ""}`}
      style={{ display: "block" }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}