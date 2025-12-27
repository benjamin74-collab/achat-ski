// src/components/AdSlot.tsx
"use client";
import { useEffect } from "react";

export default function AdSlot({ id }: { id: string }) {
  useEffect(() => {
    // Intégration SSP/Ads à venir : ici tu déclenches (re)render des tags pub
  }, []);
  return (
    <div className="w-full min-h-16 rounded-lg border border-dashed border-ring bg-white/60 text-center text-xs text-slate-500 flex items-center justify-center">
      Espace publicitaire — <code className="ml-1">{id}</code>
    </div>
  );
}
