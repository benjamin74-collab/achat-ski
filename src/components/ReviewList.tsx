// src/components/ReviewList.tsx
import StarRating from "./StarRating";

export type ReviewItem = {
  id: number;
  rating: number;
  title: string;
  body: string;
  authorName: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  createdAt: string; // ISO
};

export default function ReviewList({ items }: { items: ReviewItem[] }) {
  if (!items.length) return null;
  return (
    <ul className="mt-3 space-y-3">
      {items.map((r) => (
        <li key={r.id} className="rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <StarRating value={r.rating} size="sm" />
            <div className="text-xs text-neutral-500">
              {new Date(r.createdAt).toLocaleDateString("fr-FR")}
            </div>
          </div>
          <h4 className="mt-1 font-medium">{r.title}</h4>
          <p className="mt-1 text-sm text-neutral-700 whitespace-pre-line">{r.body}</p>
          <div className="mt-2 text-xs text-neutral-500">
            {r.authorName ? `par ${r.authorName} • ` : null}
            {r.sourceUrl ? (
              <a className="text-blue-700 underline" href={r.sourceUrl} target="_blank" rel="noopener noreferrer">
                {r.sourceName ?? "Source"}
              </a>
            ) : (
              r.sourceName ?? "—"
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
