import Link from "next/link";

type Props = {
  product: {
    slug: string;
    name: string | null;
    model: string;
    brand: string | null;
    brandRelationName?: string | null;
    imageUrl: string | null;
  };

  label: string | null;
  featured: boolean;

  offers: {
    priceCents: number;
    merchantId: number;
  }[];
};

function formatPrice(priceCents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(priceCents / 100);
}

export default function ArticleProductCard({
  product,
  label,
  featured,
  offers,
}: Props) {
  const productName =
    product.name?.trim() ||
    product.model?.trim();

  const brandName =
    product.brand?.trim() ||
    product.brandRelationName?.trim() ||
    null;

  const validOffers = offers.filter(
    (offer) =>
      Number.isFinite(offer.priceCents) &&
      offer.priceCents > 0
  );

  const bestPrice =
    validOffers.length > 0
      ? Math.min(
          ...validOffers.map(
            (offer) => offer.priceCents
          )
        )
      : null;

  const offerCount =
    new Set(
      validOffers.map(
        (offer) => offer.merchantId
      )
    ).size;

  return (
    <aside
      className={`not-prose my-8 overflow-hidden rounded-3xl border bg-white shadow-sm ${
        featured
          ? "border-brand-300 bg-brand-50/20 ring-2 ring-brand-100"
          : "border-slate-200"
      }`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr]">
        <Link
          href={`/p/${product.slug}`}
          className="flex min-h-[180px] items-center justify-center bg-slate-50 p-5"
        >
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={productName}
              loading="lazy"
              decoding="async"
              className="max-h-[180px] w-auto max-w-full object-contain"
            />
          ) : (
            <div className="flex h-32 w-full items-center justify-center rounded-2xl bg-slate-100 text-xs font-semibold text-slate-400">
              Image indisponible
            </div>
          )}
        </Link>

        <div className="flex flex-col justify-between p-5 sm:p-6">
          <div>
            {label ? (
              <div
				  className={`mb-3 inline-flex rounded-full px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide ${
					featured
					  ? "bg-brand-50 text-brand-700 ring-1 ring-brand-200"
					  : "bg-slate-100 text-slate-700 ring-1 ring-slate-200"
				  }`}
              >
                {label}
              </div>
            ) : null}

            {brandName ? (
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                {brandName}
              </p>
            ) : null}

            <Link
              href={`/p/${product.slug}`}
				className="mt-2 block text-2xl font-black leading-tight tracking-tight text-slate-950 transition hover:text-brand-700 md:text-3xl"
            >
              {productName}
            </Link>
          </div>

          <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              {bestPrice !== null ? (
                <>
                  <p className="text-xs font-medium text-slate-500">
                    À partir de
                  </p>

                  <p className="text-2xl font-black text-slate-950">
                    {formatPrice(bestPrice)}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {offerCount}{" "}
                    {offerCount === 1
                      ? "offre disponible"
                      : "offres disponibles"}
                  </p>
                </>
              ) : (
                <p className="text-sm font-medium text-slate-500">
                  Consultez les offres disponibles
                </p>
              )}
            </div>

            <Link
              href={`/p/${product.slug}`}
				className="inline-flex items-center justify-center rounded-full bg-brand-600 px-5 py-3 text-sm font-bold text-white no-underline shadow-sm transition hover:bg-brand-700 hover:text-white hover:no-underline focus:no-underline"
            >
              {bestPrice !== null
                ? "Comparer les prix"
                : "Voir le produit"}
              <span
                aria-hidden="true"
                className="ml-2 text-white"
              >
                →
              </span>
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}