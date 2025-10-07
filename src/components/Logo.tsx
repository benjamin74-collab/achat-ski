// src/components/Logo.tsx
import Link from "next/link";

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="h-6 w-6 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 shadow-glow" />
      <span className="text-lg font-semibold tracking-tight">
        Meilleur<span className="text-brand-400">-ski</span>
      </span>
    </div>
  );
}

