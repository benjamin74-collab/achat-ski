import Link from "next/link";
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
  /** Badge optionnel (ex: "Nouveau") */
  badge?: string;
};

/** Union finale de props supportées */
type Props = CommonProps & (PropsByHref | PropsByProduct);

function getLinkAndTitle(props: Props): { href: string; title: string } {
  if ("href" in props) {
    return { href: props.href, title: props.title };
  }
  // Variante par produit
  const title = [props.brand, props.model, props.season ?? ""].filter(Boolean).join(" ");
  return { href: `/p/${props.slug}`, title };
}

export default function ProductCard(props: Props) {
  const {
    imageUrl,
    offerCount,
    minPriceCents,
    currency = "EUR",
    subtitle,
    badge = "Nouveau",
  } = props;

  const { href, title } = getLinkAndTitle(props);

  return (
    <article className="card overflow-hidden group">
      <Link href={href} className="block">
        <div className="aspect-[4/3] w-full bg-muted relative">
          {imageUrl ? (
            // NOTE: on garde <img> pour l’instant; tu pourras migrer vers next/image ensuite
            <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-slate-400 text-xs">
              Photo à venir
            </div>
          )}

          {badge ? <div className="absolute left-3 top-3 pill pill-sec">{badge}</div> : null}
        </div>

        <div className="p-4">
          <h3 className="text-base font-semibold text-ink line-clamp-2">{title}</h3>

          {subtitle ? (
            <div className="mt-0.5 text-xs text-slate-500 line-clamp-1">{subtitle}</div>
          ) : null}

          <div className="mt-2 text-xs text-slate-500">
            {offerCount != null ? `${offerCount} offre${offerCount > 1 ? "s" : ""}` : "—"}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="text-xs text-slate-500">à partir de</div>
            <div className="text-lg font-extrabold text-sec-600">
              {minPriceCents != null ? money(minPriceCents, currency) : "—"}
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
