type OfferRow = {
  id: number;
  productId: number;
  merchantName: string;
  merchantSlug: string;
  priceCents: number;
  shippingCents: number | null;
  currency: string;
  inStock: boolean;
};

function money(cents: number, currency = "EUR") {
  return (cents / 100).toFixed(2) + " " + currency;
}

export default function PriceTable({ offers }: { offers: OfferRow[] }) {
  if (!offers.length) return <p className="mt-4 text-neutral-500">Aucune offre pour le moment.</p>;

  return (
    <div className="mt-6 rounded-xl border p-4">
      <div className="grid grid-cols-6 gap-3 font-medium">
        <div>Marchand</div><div>Prix</div><div>Port</div><div>Total</div><div>Stock</div><div></div>
      </div>
      {offers.map(o => {
        const total = o.priceCents + (o.shippingCents ?? 0);
        return (
          <div key={o.id} className="grid grid-cols-6 gap-3 py-3 border-t">
            <div>{o.merchantName}</div>
            <div>{money(o.priceCents, o.currency)}</div>
            <div>{o.shippingCents != null ? money(o.shippingCents, o.currency) : "—"}</div>
            <div className="font-semibold">{money(total, o.currency)}</div>
            <div>{o.inStock ? "En stock" : "—"}</div>
            <div>
              <a
                className="rounded-lg border px-3 py-1.5 hover:bg-neutral-50"
                href={`/api/go/${o.merchantSlug}/${o.id}?pid=${o.productId}`}
                rel="nofollow sponsored"
              >
                Voir l’offre
              </a>
            </div>
          </div>
        );
      })}
      <p className="mt-2 text-sm text-neutral-500">Les prix peuvent évoluer chez les marchands.</p>
    </div>
  );
}
