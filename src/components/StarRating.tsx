// src/components/StarRating.tsx
type Props = {
  value: number; // 0..5
  size?: "sm" | "md";
  showValue?: boolean;
};
export default function StarRating({ value, size = "md", showValue = false }: Props) {
  const full = Math.max(0, Math.min(5, Math.round(value)));
  const cls = size === "sm" ? "text-yellow-500 text-sm" : "text-yellow-500 text-base";
  return (
    <div className="inline-flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={cls} aria-hidden>
          {i < full ? "★" : "☆"}
        </span>
      ))}
      {showValue && <span className="ml-1 text-xs text-neutral-600">{value.toFixed(1)}/5</span>}
    </div>
  );
}
