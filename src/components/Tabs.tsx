// src/components/Tabs.tsx
"use client";
import { useState } from "react";

type Tab = { key: string; label: string; content: React.ReactNode; };

export default function Tabs({ tabs, initial = 0 }: { tabs: Tab[]; initial?: number }) {
  const [idx, setIdx] = useState(initial);
  return (
    <div className="mt-6">
      <div className="flex gap-2 border-b border-ring">
        {tabs.map((t, i) => (
          <button
            key={t.key}
            onClick={() => setIdx(i)}
            className={`px-3 py-2 text-sm rounded-t-lg ${i === idx ? "bg-white border border-b-transparent border-ring -mb-px" : "text-slate-600 hover:text-slate-800"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="card p-4 rounded-t-none rounded-b-2xl">
        {tabs[idx]?.content}
      </div>
    </div>
  );
}
