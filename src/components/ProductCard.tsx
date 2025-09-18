import { money } from "../lib/format";

type Props = {
  slug: string;
  brand: string;
  model: string;
  season?: string | null;
  minTotalCents?: number | null;
  currency?: string;
};

export default function ProductCard({ slug, brand, model, season, minTotalCents, currency = "EUR" }: Props) {
  return (
    <a href={`/p/${slug}`} className="card p-4 hover:shadow-sm transition">
      <div className="text-sm text-neutral-500">{brand}</div>
      <div className="text-lg font-semibold leading-tight">{model}</div>
      {season ? <div className="text-xs text-neutral-500 mt-1">{season}</div> : null}

      <div className="mt-4 flex items-baseline gap-2">
        {minTotalCents != null ? (
          <>
            <span className="text-sm text-neutral-500">À partir de</span>
            <span className="text-base font-semibold">{money(minTotalCents, currency)}</span>
          </>
        ) : (
          <span className="text-sm text-neutral-500">Prix à venir</span>
        )}
      </div>

      <div className="mt-3 text-blue-600 text-sm">Voir la fiche →</div>
    </a>
  );
}
