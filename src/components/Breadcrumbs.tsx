// src/components/Breadcrumbs.tsx
import Link from "next/link";

type Item = { label: string; href?: string };

export default function Breadcrumbs({ items }: { items: Item[] }) {
  return (
    <nav aria-label="Fil d’Ariane" className="text-sm text-neutral-600">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((it, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${it.label}-${i}`} className="flex items-center gap-1">
              {it.href && !last ? (
                <Link className="hover:underline" href={it.href}>
                  {it.label}
                </Link>
              ) : (
                <span className="text-neutral-900">{it.label}</span>
              )}
              {!last && <span className="text-neutral-400">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
