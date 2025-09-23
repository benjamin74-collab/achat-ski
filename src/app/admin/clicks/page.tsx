// src/app/admin/clicks/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/format";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const revalidate = 0; // données fraîches

type SP = { [k: string]: string | string[] | undefined };

// Typage exact d'une ligne avec les jointures utiles
type ClickRow = Prisma.ClickGetPayload<{
  include: {
    offer: {
      include: {
        merchant: true;
        sku: { include: { product: true } };
      };
    };
  };
}>;

function asInt(v: string | undefined, dflt: number) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : dflt;
}

export default async function AdminClicksPage({ searchParams }: { searchParams: SP }) {
  // Protection simple par clé via query param
  const key = (searchParams?.key as string) ?? "";
  if (!process.env.ADMIN_DASHBOARD_KEY || key !== process.env.ADMIN_DASHBOARD_KEY) {
    return notFound();
  }

  const page = asInt(searchParams?.page as string, 1);
  const pageSize = 50;
  const skip = (page - 1) * pageSize;

  // ⚠️ Évite Promise.all typé qui déclenchait l'erreur d'overload
  const rows = (await prisma.click.findMany({
    orderBy: { id: "desc" }, // tri stable même sans createdAt
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
  })) as ClickRow[];

  const total = await prisma.click.count();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main className="container mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-2xl font-semibold">Admin · Clics affiliés</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Total: {total} · Page {page}/{totalPages} ·{" "}
        <a className="text-blue-700 underline" href={`/api/admin/clicks?key=${encodeURIComponent(key)}`}>
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

              // Accès défensif aux champs potentiellement absents du type généré
              const rec = r as unknown as Record<string, unknown>;

              const createdAt =
                rec["createdAt"] instanceof Date ? (rec["createdAt"] as Date) : undefined;

              const ip =
                typeof rec["ip"] === "string" ? (rec["ip"] as string) : undefined;

              const userAgent =
                typeof rec["userAgent"] === "string" ? (rec["userAgent"] as string) : undefined;

              const priceCentsAtClick =
                typeof rec["priceCentsAtClick"] === "number"
                  ? (rec["priceCentsAtClick"] as number)
                  : null;

              const currencyAtClick =
                typeof rec["currencyAtClick"] === "string"
                  ? (rec["currencyAtClick"] as string)
                  : undefined;

              const shortUa =
                (userAgent ?? "").length > 60 ? (userAgent ?? "").slice(0, 57) + "..." : userAgent ?? "—";

              return (
                <tr key={String(r.id)} className="border-t">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {createdAt ? createdAt.toLocaleString("fr-FR") : "—"}
                  </td>
                  <td className="px-3 py-2">{march.name}</td>
                  <td className="px-3 py-2">
                    <Link href={`/p/${prod.slug}`} className="text-blue-700 hover:underline">
                      {[prod.brand, prod.model, prod.season].filter(Boolean).join(" ")}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-right">
                    {priceCentsAtClick != null ? money(priceCentsAtClick, currencyAtClick ?? "EUR") : "—"}
                  </td>
                  <td className="px-3 py-2">{currencyAtClick ?? "EUR"}</td>
                  <td className="px-3 py-2">{ip ?? "—"}</td>
                  <td className="px-3 py-2">{shortUa}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

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
                className={`rounded-md px-3 py-1 text-sm ${
                  n === page ? "bg-black text-white" : "border hover:bg-gray-50"
                }`}
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
