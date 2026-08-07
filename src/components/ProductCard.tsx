import Link from "next/link";
import Image from "next/image";
import { money } from "@/lib/format";

/** Devises supportées pour l’affichage */
type Currency = "EUR" | "USD" | "GBP" | "CHF";

/** Variante 1 : carte pilotée par un href + titre */
type PropsByHref = {
  href: string;
  title: string;
  subtitle?: string;
};

/** Variante 2 : carte pilotée par des champs produit */
type PropsByProduct = {
  slug: string;
  brand: string;
  model: string;
  season?: string | null;
  subtitle?: string;
};

/** Props communes */
type CommonProps = {
  imageUrl?: string;
  offerCount?: number;
  /** Prix total (centimes) à afficher “à partir de …” */
  minPriceCents?: number | null;
  currency?: Currency;
  /** Badge optionnel */
  badge?: string;
};

/** Union finale de props supportées */
type Props = CommonProps & (PropsByHref | PropsByProduct);

function getLinkAndTitle(props: Props): { href: string; title: string } {
  if ("href" in props) {
    return {
      href: props.href,
      title: props.title,
    };
  }

  const title = [props.brand, props.model, props.season ?? ""]
    .filter(Boolean)
    .join(" ");

  return {
    href: `/p/${props.slug}`,
    title,
  };
}

export default function ProductCard(props: Props) {
  const {
    imageUrl,
    offerCount,
    minPriceCents,
    currency = "EUR",
    subtitle,
    badge,
  } = props;

  const { href, title } = getLinkAndTitle(props);

  return (
    <article className="card overflow-hidden group">
      <Link href={href} className="block" aria-label={title}>
        <div className="relative aspect-[4/3] w-full bg-muted">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
			  unoptimized
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
              priority={false}
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-xs text-slate-400">
              Photo à venir
            </div>
          )}

          {badge ? (
            <div className="absolute left-3 top-3 pill pill-sec">
              {badge}
            </div>
          ) : null}
        </div>

        <div className="p-4">
          <h3 className="line-clamp-2 text-base font-semibold text-ink">
            {title}
          </h3>

          {subtitle ? (
            <div className="mt-0.5 line-clamp-1 text-xs text-slate-500">
              {subtitle}
            </div>
          ) : null}

          <div className="mt-2 text-xs text-slate-500">
            {offerCount != null
              ? `${offerCount} offre${offerCount > 1 ? "s" : ""}`
              : "—"}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="text-xs text-slate-500">à partir de</div>

            <div className="text-lg font-extrabold text-sec-600">
              {minPriceCents != null
                ? money(minPriceCents, currency)
                : "—"}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span className="chip">
              Livraison & retours selon marchand
            </span>
          </div>

          <div className="mt-4">
            <span className="btn w-full group-hover:shadow-brand">
              Voir le produit
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}