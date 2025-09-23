// src/app/api/admin/clicks/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function toCsvValue(v: unknown) {
  if (v == null) return "";
  const s = String(v);
  if (s.includes('"') || s.includes(",") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key") || req.headers.get("x-admin-key") || "";
  if (!process.env.ADMIN_DASHBOARD_KEY || key !== process.env.ADMIN_DASHBOARD_KEY) {
    return new Response("Forbidden", { status: 403 });
  }

  // Limite d’export (éviter d’exploser la mémoire)
  const limit = Math.min(10000, Number(url.searchParams.get("limit") || 5000));

  const rows = await prisma.click.findMany({
    orderBy: { createdAt: "desc" },
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

  const lines = [header.join(",")];
  for (const r of rows) {
    const prod = r.offer.sku.product;
    const march = r.offer.merchant;
	const createdAtIso = (r as any).createdAt ? new Date((r as any).createdAt).toISOString() : "";
    const line = [
	  toCsvValue(createdAtIso),
	  toCsvValue(march.name),
	  toCsvValue([prod.brand, prod.model, prod.season].filter(Boolean).join(" ")),
	  toCsvValue(prod.slug),
	  toCsvValue(r.priceCentsAtClick ?? ""),
	  toCsvValue(r.currencyAtClick || "EUR"),
	  toCsvValue(r.ip || ""),
	  toCsvValue(r.userAgent || ""),
	].join(",");
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
