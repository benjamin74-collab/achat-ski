import Link from "next/link";
import MerchantLogo from "./MerchantLogo"; // <--- ajout
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
  if (!offers.length) return <p className="mt-4 text-neutral-500">Aucune offre pour le moment.</p>;

  const sorted = [...offers].sort(
    (a, b) => totalCents(a.priceCents, a.shippingCents) - totalCents(b.priceCents, b.shippingCents)
  );
  const bestId = sorted[0]?.id;

  const lastUpdated = sorted
    .map((o) => (o.lastSeen ? new Date(o.lastSeen).getTime() : 0))
    .reduce((a, b) => Math.max(a, b), 0);

  return (
    <div className="mt-6 rounded-xl border p-4">
      <div className="grid grid-cols-6 gap-3 font-medium">
        <div>Marchand</div>
        <div>Prix</div>
        <div>Port</div>
        <div>Total</div>
        <div>Stock</div>
        <div></div>
      </div>

      {sorted.map((o) => {
        const total = totalCents(o.priceCents, o.shippingCents);
        const isBest = o.id === bestId && o.inStock;
        return (
          <div key={o.id} className="grid grid-cols-6 gap-3 py-3 border-t items-center">
            <div className="flex items-center gap-2">
              <MerchantLogo slug={o.merchantSlug} name={o.merchantName} />
              {isBest && (
                <span className="text-xs rounded bg-green-100 px-2 py-0.5 text-green-700">Meilleur prix</span>
              )}
            </div>
            <div>{money(o.priceCents, o.currency)}</div>
            <div>{o.shippingCents != null ? money(o.shippingCents, o.currency) : "—"}</div>
            <div className="font-semibold">{money(total, o.currency)}</div>
            <div className={o.inStock ? "text-green-700" : "text-neutral-500"}>
              {o.inStock ? "En stock" : "Hors stock"}
            </div>
            <div className="text-right">
              <Link
                href={`/api/go/${o.merchantSlug}/${o.id}`}
                target="_blank"
                rel="nofollow sponsored noopener"
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium border hover:shadow transition ${
                  o.inStock ? "bg-black text-white border-black hover:opacity-90" : "opacity-50 pointer-events-none"
                }`}
                prefetch={false}
              >
                Voir chez {o.merchantName}
              </Link>
            </div>
          </div>
        );
      })}

      {lastUpdated > 0 && (
        <p className="mt-3 text-sm text-neutral-500">
          Dernière mise à jour : {new Date(lastUpdated).toLocaleString("fr-FR")}
        </p>
      )}
      <p className="mt-1 text-xs text-neutral-500">Les prix peuvent évoluer chez les marchands.</p>
    </div>
  );
}
