// src/app/admin/clicks/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/format";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const revalidate = 0;

type SP = {
  [k: string]: string | string[] | undefined;
};

type ClickRow = Prisma.ClickGetPayload<{
  include: {
    offer: {
      include: {
        merchant: true;
        product: true;
      };
    };
  };
}>;

function asInt(value: string | undefined, fallback: number) {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0
    ? Math.floor(parsed)
    : fallback;
}

export default async function AdminClicksPage({
  searchParams,
}: {
  searchParams: SP;
}) {
  const key = (searchParams?.key as string) ?? "";

  if (
    !process.env.ADMIN_DASHBOARD_KEY ||
    key !== process.env.ADMIN_DASHBOARD_KEY
  ) {
    return notFound();
  }

  const page = asInt(searchParams?.page as string, 1);
  const pageSize = 50;
  const skip = (page - 1) * pageSize;

  const rows: ClickRow[] = await prisma.click.findMany({
    orderBy: {
      id: "desc",
    },
    skip,
    take: pageSize,
    include: {
      offer: {
        include: {
          merchant: true,
          product: true,
        },
      },
    },
  });

  const total = await prisma.click.count();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main className="container mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-2xl font-semibold">
        Admin · Clics affiliés
      </h1>

      <p className="mt-1 text-sm text-neutral-600">
        Total : {total} · Page {page}/{totalPages} ·{" "}
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
              <th className="px-3 py-2 text-left">
                Date
              </th>

              <th className="px-3 py-2 text-left">
                Marchand
              </th>

              <th className="px-3 py-2 text-left">
                Produit
              </th>

              <th className="px-3 py-2 text-right">
                Prix au clic
              </th>

              <th className="px-3 py-2 text-left">
                Devise
              </th>

              <th className="px-3 py-2 text-left">
                IP
              </th>

              <th className="px-3 py-2 text-left">
                UA abrégé
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => {
              const product = row.offer.product;
              const merchant = row.offer.merchant;

              const record = row as unknown as Record<
                string,
                unknown
              >;

              const createdAt =
                record.createdAt instanceof Date
                  ? record.createdAt
                  : undefined;

              const ip =
                typeof record.ip === "string"
                  ? record.ip
                  : undefined;

              const userAgent =
                typeof record.userAgent === "string"
                  ? record.userAgent
                  : undefined;

              const priceCentsAtClick =
                typeof record.priceCentsAtClick === "number"
                  ? record.priceCentsAtClick
                  : null;

              const currencyAtClick =
                typeof record.currencyAtClick === "string"
                  ? record.currencyAtClick
                  : undefined;

              const shortUserAgent =
                (userAgent ?? "").length > 60
                  ? `${(userAgent ?? "").slice(0, 57)}...`
                  : userAgent ?? "—";

              const productName = [
                product.brand,
                product.model,
                product.season,
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <tr
                  key={String(row.id)}
                  className="border-t"
                >
                  <td className="whitespace-nowrap px-3 py-2">
                    {createdAt
                      ? createdAt.toLocaleString("fr-FR")
                      : "—"}
                  </td>

                  <td className="px-3 py-2">
                    {merchant.name}
                  </td>

                  <td className="px-3 py-2">
                    <Link
                      href={`/p/${product.slug}`}
                      className="text-blue-700 hover:underline"
                    >
                      {productName || product.slug}
                    </Link>
                  </td>

                  <td className="px-3 py-2 text-right">
                    {priceCentsAtClick !== null
                      ? money(
                          priceCentsAtClick,
                          currencyAtClick ?? "EUR",
                        )
                      : "—"}
                  </td>

                  <td className="px-3 py-2">
                    {currencyAtClick ?? "EUR"}
                  </td>

                  <td className="px-3 py-2">
                    {ip ?? "—"}
                  </td>

                  <td className="px-3 py-2">
                    {shortUserAgent}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <nav className="mt-4 flex flex-wrap items-center gap-2">
          {Array.from({
            length: totalPages,
          }).map((_, index) => {
            const pageNumber = index + 1;
            const params = new URLSearchParams();

            params.set("key", key);
            params.set("page", String(pageNumber));

            return (
              <Link
                key={pageNumber}
                href={`/admin/clicks?${params.toString()}`}
                className={`rounded-md px-3 py-1 text-sm ${
                  pageNumber === page
                    ? "bg-black text-white"
                    : "border hover:bg-gray-50"
                }`}
              >
                {pageNumber}
              </Link>
            );
          })}
        </nav>
      )}
    </main>
  );
}