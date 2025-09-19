type AttrValue = string | number | boolean | null;
type Props = { attributes?: Record<string, AttrValue> | null };

export default function Specs({ attributes }: Props) {
  if (!attributes || Object.keys(attributes).length === 0) return null;
  return (
    <section className="card p-4">
      <h2 className="text-lg font-semibold">Caractéristiques</h2>
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        {Object.entries(attributes).map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3 border-b py-2">
            <span className="text-neutral-500">{k}</span>
            <span className="font-medium">{String(v)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
