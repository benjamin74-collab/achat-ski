import Link from "next/link";
import { money } from "@/lib/format";

type Currency = "EUR" | "USD" | "GBP" | "CHF";

type Props = {
  slug: string;
  brand: string;
  model: string;
  season: string | null;
  minTotalCents: number | null;
  currency?: Currency; // ← typé correctement, valeur par défaut plus bas
  imageUrl?: string;
  offerCount?: number;
};

export default function ProductCard({
  slug,
  brand,
  model,
  season,
  minTotalCents,
  currency = "EUR",
  imageUrl,
  offerCount,
}: Props) {
  const title = [brand, model, season ?? ""].filter(Boolean).join(" ");

  return (
    <article className="card overflow-hidden group">
      <Link href={`/p/${slug}`} className="block">
        <div className="aspect-[4/3] w-full bg-muted relative">
          {imageUrl ? (
            // TODO: remplacer par next/image plus tard pour optimiser
            <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-slate-400 text-xs">
              Photo à venir
            </div>
          )}
          <div className="absolute left-3 top-3 pill pill-sec">Nouveau</div>
        </div>

        <div className="p-4">
          <h3 className="text-base font-semibold text-ink line-clamp-2">{title}</h3>
          <div className="mt-1 text-xs text-slate-500">
            {offerCount != null ? `${offerCount} offre${offerCount > 1 ? "s" : ""}` : "—"}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="text-xs text-slate-500">à partir de</div>
            <div className="text-lg font-extrabold text-sec-600">
              {minTotalCents != null ? money(minTotalCents, currency) : "—"}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span className="chip">Livraison & retours selon marchand</span>
          </div>

          <div className="mt-4">
            <span className="btn w-full group-hover:shadow-brand">Voir le produit</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
