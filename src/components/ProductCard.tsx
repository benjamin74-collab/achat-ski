import Link from "next/link";
import { money } from "@/lib/format";

export default function ProductCard(props: {
  href: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  minPriceCents?: number | null;
  offerCount?: number;
}) {
  const { href, title, subtitle, imageUrl, minPriceCents, offerCount } = props;
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-ring bg-card/70 hover:bg-card transition shadow-card overflow-hidden"
    >
      <div className="aspect-[4/3] w-full bg-surface/60">
        {/* image placeholder */}
        {imageUrl ? (
          // tu pourras basculer sur next/image plus tard
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="p-4">
        <div className="text-sm text-slate-400">{subtitle}</div>
        <div className="mt-1 font-medium text-white line-clamp-2">{title}</div>
        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-slate-400">{offerCount ?? 0} offre{(offerCount ?? 0) > 1 ? "s" : ""}</div>
          <div className="text-brand-300 font-semibold">
            {minPriceCents != null ? money(minPriceCents, "EUR") : "—"}
          </div>
        </div>
      </div>
    </Link>
  );
}
