import Link from "next/link";

type Crumb = { href?: string; label: string };

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="text-sm text-neutral-600" aria-label="Fil d’Ariane">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-1">
              {c.href && !last ? (
                <Link href={c.href} className="hover:underline">{c.label}</Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className={last ? "text-neutral-900" : ""}>
                  {c.label}
                </span>
              )}
              {!last && <span className="text-neutral-400">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
