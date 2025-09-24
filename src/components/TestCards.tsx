// src/components/TestCards.tsx
export type TestItem = {
  id: number;
  title: string;
  excerpt: string;
  score: number | null;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string; // ISO
};

export default function TestCards({ items }: { items: TestItem[] }) {
  if (!items.length) return null;
  return (
    <ul className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
      {items.map((t) => (
        <li key={t.id} className="rounded-2xl border p-4 hover:shadow-sm transition">
          <div className="text-xs text-neutral-500">
            {new Date(t.publishedAt).toLocaleDateString("fr-FR")}
          </div>
          <h4 className="mt-1 font-semibold">{t.title}</h4>
          {t.score != null && (
            <div className="mt-1 text-sm text-neutral-700">Note : <b>{t.score.toFixed(1)}</b></div>
          )}
          <p className="mt-2 text-sm text-neutral-700">{t.excerpt}</p>
          <a
            className="mt-3 inline-block text-sm text-blue-700 underline"
            href={t.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Lire sur {t.sourceName}
          </a>
        </li>
      ))}
    </ul>
  );
}
