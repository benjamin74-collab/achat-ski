// src/app/admin/clicks/page.tsx
// import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/format";

export const runtime = "nodejs";
export const revalidate = 0; // page admin: données fraîches

type SP = { [k: string]: string | string[] | undefined };

function asInt(v: string | undefined, dflt: number) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : dflt;
}

export default async function AdminClicksPage({ searchParams }: { searchParams: SP }) {
  // Protection par clé
  //const key = (searchParams?.key as string) ?? headers().get("x-admin-key") ?? "";
  const key = (searchParams?.key as string) ?? "";
  if (!process.env.ADMIN_DASHBOARD_KEY || key !== process.env.ADMIN_DASHBOARD_KEY) {
    return notFound();
  }

  const page = asInt(searchParams?.page as string, 1);
  const pageSize = 50;
  const skip = (page - 1) * pageSize;

  // Récup clics avec jointures utiles
  const [rows, total] = await Promise.all([
    prisma.click.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        offer: {
          include: {
            merchant: true,
            sku: { include: { product: true } },
          },
        },
      },
    }),
    prisma.click.count(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main className="container mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-2xl font-semibold">Admin · Clics affiliés</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Total: {total} · Page {page}/{totalPages} ·{" "}
        <a
          className="text-blue-700 underline"
          href={`/api/admin/clicks?key=${encodeURIComponent(key)}`}
        >
          Export CSV
        </a>
      </p>

      <div className="mt-4 overflow-x-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Marchand</th>
              <th className="px-3 py-2 text-left">Produit</th>
              <th className="px-3 py-2 text-right">Prix @clic</th>
              <th className="px-3 py-2 text-left">Devise</th>
              <th className="px-3 py-2 text-left">IP</th>
              <th className="px-3 py-2 text-left">UA (abrégé)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const prod = r.offer.sku.product;
              const march = r.offer.merchant;
              const ua = typeof r.userAgent === "string" ? r.userAgent : "";
              const shortUa = ua.length > 60 ? ua.slice(0, 57) + "..." : (ua || "—");
              const ip = r.ip ?? "—";
              return (
                <tr key={String(r.id)} className="border-t">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {new Date(r.createdAt).toLocaleString("fr-FR")}
                  </td>
                  <td className="px-3 py-2">{march.name}</td>
                  <td className="px-3 py-2">
                    <Link href={`/p/${prod.slug}`} className="text-blue-700 hover:underline">
                      {[prod.brand, prod.model, prod.season].filter(Boolean).join(" ")}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-right">
                    {r.priceCentsAtClick != null ? money(r.priceCentsAtClick, r.currencyAtClick || "EUR") : "—"}
                  </td>
                  <td className="px-3 py-2">{r.currencyAtClick || "EUR"}</td>
                  <td className="px-3 py-2">{ip}</td>
                  <td className="px-3 py-2">{shortUa}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-4 flex items-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => {
            const n = i + 1;
            const sp = new URLSearchParams();
            sp.set("key", key);
            sp.set("page", String(n));
            return (
              <Link
                key={n}
                href={`/admin/clicks?${sp.toString()}`}
                className={`rounded-md px-3 py-1 text-sm ${n === page ? "bg-black text-white" : "border hover:bg-gray-50"}`}
              >
                {n}
              </Link>
            );
          })}
        </nav>
      )}
    </main>
  );
}
