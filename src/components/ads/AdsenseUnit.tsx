"use client";

import { useEffect } from "react";

type Props = {
  client: string;
  slot: string;
  className?: string;
  testLabel?: string;
};

export default function AdsenseUnit({ client, slot, className, testLabel = "Emplacement publicitaire" }: Props) {
  useEffect(() => {
    if (!client || !slot) return;

    try {
      // @ts-expect-error adsbygoogle global
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // ignore
    }
  }, [client, slot]);

  if (!client || !slot) return null;

  return (
    <div className={`relative min-h-[120px] ${className ?? ""}`}>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        {testLabel}
      </div>

      <ins
        className="adsbygoogle relative z-10 block"
        style={{ display: "block" }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}