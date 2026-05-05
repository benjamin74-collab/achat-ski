"use client";

import { useEffect, useState } from "react";

type Props = {
  client: string;
  slot: string;
  className?: string;
  testLabel?: string;
};

export default function AdsenseUnit({
  client,
  slot,
  className,
  testLabel = "Emplacement publicitaire",
}: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !client || !slot) return;

    const timer = window.setTimeout(() => {
      try {
        // @ts-expect-error adsbygoogle global
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        // ignore
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [mounted, client, slot]);

  if (!client || !slot) return null;

  if (!mounted) {
    return (
      <div className={`relative min-h-[160px] ${className ?? ""}`}>
        <div className="flex min-h-[160px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          {testLabel}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative min-h-[160px] ${className ?? ""}`} suppressHydrationWarning>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        {testLabel}
      </div>

      <ins
        key={`${client}-${slot}`}
        className="adsbygoogle relative z-10 block min-h-[160px]"
        style={{ display: "block" }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}