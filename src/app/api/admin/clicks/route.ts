// src/app/api/admin/clicks/route.ts
import { NextResponse } from "next/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";

// Typage exact d'une ligne avec les jointures utiles
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

function toCsvValue(value: unknown): string {
  if (value == null) return "";

  const stringValue = String(value);
  const needsQuotes = /[",\n\r]/.test(stringValue);
  const escapedValue = stringValue.replace(/"/g, '""');

  return needsQuotes ? `"${escapedValue}"` : escapedValue;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key") ?? "";

  if (
    !process.env.ADMIN_DASHBOARD_KEY ||
    key !== process.env.ADMIN_DASHBOARD_KEY
  ) {
    return notFound();
  }

  const rows: ClickRow[] = await prisma.click.findMany({
    orderBy: {
      id: "desc",
    },
    include: {
      offer: {
        include: {
          merchant: true,
          product: true,
        },
      },
    },
  });

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

  for (const row of rows) {
    const product = row.offer.product;
    const merchant = row.offer.merchant;

    const record = row as unknown as Record<string, unknown>;

    const createdAt =
      record.createdAt instanceof Date
        ? record.createdAt
        : undefined;

    const priceCentsAtClick =
      typeof record.priceCentsAtClick === "number"
        ? record.priceCentsAtClick
        : "";

    const currencyAtClick =
      typeof record.currencyAtClick === "string"
        ? record.currencyAtClick
        : "EUR";

    const ip =
      typeof record.ip === "string"
        ? record.ip
        : "";

    const userAgent =
      typeof record.userAgent === "string"
        ? record.userAgent
        : "";

    const dateString = createdAt
      ? createdAt.toISOString()
      : "";

    const productName = [
      product.brand,
      product.model,
      product.season,
    ]
      .filter(Boolean)
      .join(" ");

    const csvRow = [
      toCsvValue(row.id),
      toCsvValue(dateString),
      toCsvValue(merchant.name),
      toCsvValue(productName || product.name || product.slug),
      toCsvValue(product.slug),
      toCsvValue(priceCentsAtClick),
      toCsvValue(currencyAtClick),
      toCsvValue(ip),
      toCsvValue(userAgent),
    ].join(",");

    lines.push(csvRow);
  }

  const csv = `\uFEFF${lines.join("\r\n")}`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="clicks_export.csv"',
      "Cache-Control": "no-store",
    },
  });
}