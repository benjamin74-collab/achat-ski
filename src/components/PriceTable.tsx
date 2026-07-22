import Link from "next/link";
import { money, totalCents } from "../lib/format";

type OfferRow = {
  id: number;
  productId: number;
  merchantName: string;
  merchantSlug: string;
  priceCents: number;
  shippingCents: number | null;
  currency: string;
  inStock: boolean;
  lastSeen?: string | null;
};

export default function PriceTable({ offers }: { offers: OfferRow[] }) {
  if (!offers.length) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
        Aucune offre disponible pour le moment.
      </div>
    );
  }

  const sorted = [...offers].sort(
    (a, b) =>
      totalCents(a.priceCents, a.shippingCents) -
      totalCents(b.priceCents, b.shippingCents),
  );

  const bestId = sorted.find((offer) => offer.inStock)?.id ?? sorted[0]?.id;

  const lastUpdated = sorted
    .map((offer) => (offer.lastSeen ? new Date(offer.lastSeen).getTime() : 0))
    .reduce((a, b) => Math.max(a, b), 0);

  return (
    <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-4 md:px-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
              Comparateur
            </p>

            <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">
              Offres disponibles
            </h2>
          </div>

          <p className="text-sm text-slate-500">
            {sorted.length} offre{sorted.length > 1 ? "s" : ""} marchand
          </p>
        </div>
      </div>

      <div className="hidden md:block">
        <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr_1fr_1.3fr] gap-4 border-b border-slate-200 px-6 py-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
          <div>Marchand</div>
          <div>Prix</div>
          <div>Livraison</div>
          <div>Total</div>
          <div>Stock</div>
          <div className="text-right">Accès</div>
        </div>

        {sorted.map((offer) => {
          const total = totalCents(offer.priceCents, offer.shippingCents);
          const isBest = offer.id === bestId && offer.inStock;

          return (
            <div
              key={offer.id}
              className={`grid grid-cols-[1.4fr_1fr_1fr_1fr_1fr_1.3fr] items-center gap-4 border-b border-slate-100 px-6 py-4 last:border-b-0 ${
                isBest ? "bg-emerald-50/50" : "bg-white"
              }`}
            >
              <div>
                <div className="font-semibold text-slate-950">
                  {offer.merchantName}
                </div>

                {isBest ? (
                  <span className="mt-1 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                    Meilleur prix
                  </span>
                ) : null}
              </div>

              <div className="text-sm font-semibold text-slate-900">
                {money(offer.priceCents, offer.currency)}
              </div>

              <div className="text-sm text-slate-600">
                {offer.shippingCents != null
                  ? money(offer.shippingCents, offer.currency)
                  : "—"}
              </div>

              <div className="text-base font-black text-slate-950">
                {money(total, offer.currency)}
              </div>

              <div>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                    offer.inStock
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {offer.inStock ? "En stock" : "Hors stock"}
                </span>
              </div>

              <div className="text-right">
                <Link
                  href={`/api/go/${offer.merchantSlug}/${offer.id}`}
                  target="_blank"
                  rel="nofollow sponsored noopener"
                  prefetch={false}
                  className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-bold transition ${
                    offer.inStock
                      ? "bg-slate-950 text-white hover:bg-brand-700"
                      : "pointer-events-none bg-slate-200 text-slate-400"
                  }`}
                >
                  Voir l’offre
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-3 p-4 md:hidden">
        {sorted.map((offer) => {
          const total = totalCents(offer.priceCents, offer.shippingCents);
          const isBest = offer.id === bestId && offer.inStock;

          return (
            <article
              key={offer.id}
              className={`rounded-3xl border p-4 ${
                isBest
                  ? "border-emerald-200 bg-emerald-50/60"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-950">
                    {offer.merchantName}
                  </div>

                  {isBest ? (
                    <span className="mt-1 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                      Meilleur prix
                    </span>
                  ) : null}
                </div>

                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    offer.inStock
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {offer.inStock ? "En stock" : "Hors stock"}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                <div>
                  <div className="text-xs text-slate-500">Prix</div>
                  <div className="font-semibold">
                    {money(offer.priceCents, offer.currency)}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-500">Port</div>
                  <div className="font-semibold">
                    {offer.shippingCents != null
                      ? money(offer.shippingCents, offer.currency)
                      : "—"}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-500">Total</div>
                  <div className="font-black">
                    {money(total, offer.currency)}
                  </div>
                </div>
              </div>

              <Link
                href={`/api/go/${offer.merchantSlug}/${offer.id}`}
                target="_blank"
                rel="nofollow sponsored noopener"
                prefetch={false}
                className={`mt-4 inline-flex w-full items-center justify-center rounded-full px-4 py-2.5 text-sm font-bold ${
                  offer.inStock
                    ? "bg-slate-950 text-white hover:bg-brand-700"
                    : "pointer-events-none bg-slate-200 text-slate-400"
                }`}
              >
                Voir chez {offer.merchantName}
              </Link>
            </article>
          );
        })}
      </div>

      <div className="border-t border-slate-200 bg-slate-50/70 px-5 py-3 text-xs text-slate-500 md:px-6">
        {lastUpdated > 0 ? (
          <p>
            Dernière mise à jour :{" "}
            {new Date(lastUpdated).toLocaleString("fr-FR")}
          </p>
        ) : null}

        <p className="mt-1">
          Les prix peuvent évoluer chez les marchands. Certains liens sont
          affiliés.
        </p>
      </div>
    </div>
  );
}