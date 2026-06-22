"use client";

type TocItem = {
  id: string;
  text: string;
  level: 2 | 3;
};

export default function MobileToc({ items }: { items: TocItem[] }) {
  if (!items.length) return null;

  return (
    <div className="sticky top-[116px] z-40 -mx-4 mb-6 lg:hidden">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between bg-brand-700 px-5 py-2.5 text-white shadow-md">
          <span className="text-sm font-black uppercase tracking-[0.18em]">
            Sommaire
          </span>

          <span className="text-lg font-black leading-none group-open:hidden">
            ˅
          </span>

          <span className="hidden text-lg font-black leading-none group-open:block">
            ×
          </span>
        </summary>

        <div className="fixed inset-x-0 top-[156px] z-50 mx-4 max-h-[50vh] overflow-y-auto rounded-b-3xl border border-slate-200 bg-white p-4 shadow-2xl">
          <nav>
            <ul className="space-y-1.5 text-sm">
              {items.map((item) => (
                <li key={item.id} className={item.level === 3 ? "pl-4" : ""}>
                  <a
                    href={`#${item.id}`}
                    className={`block rounded-xl px-3 py-2 leading-snug transition hover:bg-brand-50 hover:text-brand-700 ${
                      item.level === 3
                        ? "text-sm text-slate-500"
                        : "font-semibold text-slate-800"
                    }`}
                  >
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </details>
    </div>
  );
}