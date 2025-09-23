// src/app/api/admin/clicks/route.ts
import { NextResponse } from "next/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";

// Typage de la ligne avec les jointures utiles
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

function toCsvValue(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  // échappe les guillemets, entoure si virgule/retour chariot
  const needsQuotes = /[",\n\r]/.test(s);
  const esc = s.replace(/"/g, '""');
  return needsQuotes ? `"${esc}"` : esc;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key") ?? "";
  if (!process.env.ADMIN_DASHBOARD_KEY || key !== process.env.ADMIN_DASHBOARD_KEY) {
    // on garde la même sémantique que la page admin: 404 si clé invalide
    return notFound();
  }

  // Récup des clics (pas de pagination ici: export complet)
  const rows = (await prisma.click.findMany({
    orderBy: { id: "desc" },
    include: {
      offer: {
        include: {
          merchant: true,
          sku: { include: { product: true } },
        },
      },
    },
  })) as ClickRow[];

  // En-têtes CSV
  const header = [
    "id",
    "date",
    "merchant",
    "product_name",
    "product_slug",
    "price_at_click_cents",
    "currency_at_click",
    "ip",
    "user_agent",
  ].join(",");

  const lines: string[] = [header];

  for (const r of rows) {
    const prod = r.offer.sku.product;
    const march = r.offer.merchant;

    // Accès défensif aux champs optionnels/non typés côté Prisma
    const rec = r as unknown as Record<string, unknown>;
    const createdAt = rec["createdAt"] instanceof Date ? (rec["createdAt"] as Date) : undefined;
    const priceCentsAtClick =
      typeof rec["priceCentsAtClick"] === "number" ? (rec["priceCentsAtClick"] as number) : "";
    const currencyAtClick =
      typeof rec["currencyAtClick"] === "string" ? (rec["currencyAtClick"] as string) : "EUR";
    const ip = typeof rec["ip"] === "string" ? (rec["ip"] as string) : "";
    const userAgent = typeof rec["userAgent"] === "string" ? (rec["userAgent"] as string) : "";

    const dateStr = createdAt ? createdAt.toISOString() : "";

    const row = [
      toCsvValue(r.id),
      toCsvValue(dateStr),
      toCsvValue(march.name),
      toCsvValue([prod.brand, prod.model, prod.season].filter(Boolean).join(" ")),
      toCsvValue(prod.slug),
      toCsvValue(priceCentsAtClick),
      toCsvValue(currencyAtClick),
      toCsvValue(ip),
      toCsvValue(userAgent),
    ].join(",");

    lines.push(row);
  }

  const csv = lines.join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clicks_export.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
