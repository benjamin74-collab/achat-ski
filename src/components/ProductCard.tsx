type Props = {
  slug: string;
  brand: string;
  model: string;
  season?: string | null;
};

export default function ProductCard({ slug, brand, model, season }: Props) {
  return (
    <a href={`/p/${slug}`} className="rounded-xl border p-4 hover:bg-neutral-50 block">
      <div className="text-sm text-neutral-500">{brand}</div>
      <div className="text-lg font-semibold leading-tight">{model}</div>
      {season ? <div className="text-xs text-neutral-500 mt-1">{season}</div> : null}
      <div className="mt-3 text-blue-600 text-sm">Voir la fiche →</div>
    </a>
  );
}
