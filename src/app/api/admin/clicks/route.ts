// src/app/api/admin/clicks/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Click, Offer, Merchant, Sku, Product } from "@prisma/client";

export const runtime = "nodejs";

function toCsvValue(v: unknown) {
  if (v == null) return "";
  const s = String(v);
  if (s.includes('"') || s.includes(",") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

// Typage fort du résultat avec includes
type Row = Click & {
  offer: Offer & {
    merchant: Merchant;
    sku: Sku & {
      product: Product;
    };
  };
};

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key") || req.headers.get("x-admin-key") || "";
  if (!process.env.ADMIN_DASHBOARD_KEY || key !== process.env.ADMIN_DASHBOARD_KEY) {
    return new Response("Forbidden", { status: 403 });
  }

  const limitParam = Number(url.searchParams.get("limit") || 5000);
  const limit = Number.isFinite(limitParam) ? Math.min(10000, Math.max(1, Math.floor(limitParam))) : 5000;

  const rows: Row[] = await prisma.click.findMany({
    orderBy: { id: "desc" }, // robuste même sans createdAt
    take: limit,
    include: {
      offer: {
        include: {
          merchant: true,
          sku: { include: { product: true } },
        },
      },
    },
  });

  const header = [
    "createdAt",
    "merchant",
    "product",
    "productSlug",
    "priceCentsAtClick",
    "currency",
    "ip",
    "userAgent",
  ];

  const lines: string[] = [header.join(",")];

  for (const r of rows) {
    // Accès optionnel sans 'any'
    const createdAtUnknown = (r as Record<string, unknown>)["createdAt"];
    const createdAtIso = createdAtUnknown instanceof Date ? createdAtUnknown.toISOString() : "";

    const prod = r.offer.sku.product;
    const march = r.offer.merchant;

    lines.push(
      [
        toCsvValue(createdAtIso),
        toCsvValue(march.name),
        toCsvValue([prod.brand, prod.model, prod.season].filter(Boolean).join(" ")),
        toCsvValue(prod.slug),
        toCsvValue(r.priceCentsAtClick ?? ""),
        toCsvValue(r.currencyAtClick || "EUR"),
        toCsvValue(r.ip || ""),
        toCsvValue(r.userAgent || ""),
      ].join(",")
    );
  }

  const body = lines.join("\n");
  return new Response(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="clicks.csv"`,
      "cache-control": "no-store",
    },
  });
}
