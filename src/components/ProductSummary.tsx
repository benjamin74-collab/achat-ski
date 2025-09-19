import { money, totalCents } from "../lib/format";

type OfferLite = {
  priceCents: number;
  shippingCents: number | null;
  currency: string;
  inStock: boolean;
};

export default function ProductSummary({ offers }: { offers: OfferLite[] }) {
  if (!offers.length) return null;

  const totals = offers
    .filter(o => o.inStock)
    .map(o => totalCents(o.priceCents, o.shippingCents ?? 0));

  const best = totals.length ? Math.min(...totals) : null;
  const nbShops = offers.length;

  return (
    <div className="card p-4 flex items-center justify-between">
      <div>
        <div className="text-sm text-neutral-500">Comparateur</div>
        <div className="text-lg font-semibold">
          {best != null ? `À partir de ${money(best)}` : "Tarifs à venir"}
        </div>
        <div className="text-sm text-neutral-500">{nbShops} offre{nbShops > 1 ? "s" : ""} trouvée{nbShops > 1 ? "s" : ""}</div>
      </div>
      <div className="badge-green">Meilleur prix</div>
    </div>
  );
}
