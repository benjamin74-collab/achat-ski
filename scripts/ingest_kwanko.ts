import { PrismaClient } from "@prisma/client";
import { parse } from "csv-parse/sync";
import fs from "fs";
import path from "path";
import { slugify } from "../src/lib/slug";

const prisma = new PrismaClient();

type RawRow = Record<string, string>;

type NormRow = {
  merchant: string;
  productName: string;
  brand: string;
  model: string;
  season?: string | null;
  priceCents: number;
  shippingCents: number | null;
  currency: string;
  inStock: boolean;
  affiliateUrl: string;
  gtin?: string | null;
  externalId?: string | null;
};

function pick(obj: RawRow, keys: string[]): string | undefined {
  for (const key of keys) {
    const direct = obj[key];
    if (direct != null && String(direct).trim() !== "") {
      return String(direct).trim();
    }

    const lower = obj[key.toLowerCase()];
    if (lower != null && String(lower).trim() !== "") {
      return String(lower).trim();
    }
  }

  return undefined;
}

function toCents(value?: string): number | null {
  if (!value) return null;

  const cleaned = String(value)
    .replace(/\s/g, "")
    .replace(",", ".")
    .replace(/[^\d.]/g, "");

  const parsed = Number(cleaned);

  return Number.isFinite(parsed) ? Math.round(parsed * 100) : null;
}

function titleCaseBrand(value: string): string {
  if (!value) return value;

  const lower = value.toLowerCase();

  if (lower.length <= 4) return value.toUpperCase();

  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function normalizeRow(row: RawRow): NormRow | null {
  const merchant =
    pick(row, ["merchant", "merchant_name", "shop", "store", "retailer"]) ??
    "marchand";

  const productName = pick(row, ["product_name", "name", "title"]) ?? "";
  const brandRaw = pick(row, ["brand", "marque"]) ?? "";
  const brand = brandRaw ? titleCaseBrand(brandRaw) : brandRaw;
  const modelRaw = pick(row, ["model", "product", "title", "name"]) ?? productName;
  const season = pick(row, ["season", "saison"]) ?? null;

  const priceCents =
    toCents(pick(row, ["price", "price_eur", "price_euros", "sale_price"])) ?? 0;

  const shippingCents =
    toCents(pick(row, ["shipping_cost", "shipping", "delivery_cost"])) ?? 0;

  const currency = (pick(row, ["currency", "devise"]) ?? "EUR").toUpperCase();

  const availability = (
    pick(row, ["availability", "in_stock", "instock", "stock"]) ?? ""
  ).toLowerCase();

  const inStock = availability
    ? /(1|true|yes|enstock|instock|available|disponible|oui)/.test(availability)
    : true;

  const affiliateUrl =
    pick(row, ["deeplink", "aw_deeplink", "product_url", "url", "link"]) ?? "";

  if (!productName || !affiliateUrl || !priceCents) return null;

  const inferredBrand = brand || productName.split(" ")[0] || "Unknown";
  const model = brand
    ? modelRaw
    : productName.replace(new RegExp(`^${inferredBrand}\\s+`, "i"), "");

  const gtin = pick(row, ["gtin", "ean", "barcode"]) ?? null;
  const externalId = pick(row, ["id", "product_id", "offer_id", "sku"]) ?? null;

  return {
    merchant,
    productName,
    brand: inferredBrand,
    model,
    season,
    priceCents,
    shippingCents,
    currency,
    inStock,
    affiliateUrl,
    gtin,
    externalId,
  };
}

async function upsertOne(row: NormRow) {
  const merchantSlug = slugify(row.merchant);

  const merchant = await prisma.merchant.upsert({
    where: { slug: merchantSlug },
    update: {
      name: row.merchant,
      platform: "KWANKO",
      network: "kwanko",
      active: true,
    },
    create: {
      slug: merchantSlug,
      name: row.merchant,
      platform: "KWANKO",
      network: "kwanko",
      active: true,
    },
  });

  const brandSlug = slugify(row.brand);

  const brand = await prisma.brand.upsert({
    where: { slug: brandSlug },
    update: {
      name: row.brand,
      active: true,
    },
    create: {
      slug: brandSlug,
      name: row.brand,
      active: true,
    },
  });

  const productSlug = slugify(
    [row.brand, row.model, row.season ?? ""].filter(Boolean).join(" ")
  );

  const product = await prisma.product.upsert({
    where: { slug: productSlug },
    update: {
      name: row.model,
      model: row.model,
      brand: row.brand,
      brandId: brand.id,
      season: row.season,
      active: true,
    },
    create: {
      slug: productSlug,
      name: row.model,
      model: row.model,
      brand: row.brand,
      brandId: brand.id,
      season: row.season,
      active: true,
    },
  });

  let sku = await prisma.sku.findFirst({
    where: {
      productId: product.id,
      ...(row.gtin ? { gtin: row.gtin } : { displayName: "default" }),
    },
  });

  if (!sku) {
    sku = await prisma.sku.create({
      data: {
        productId: product.id,
        displayName: "default",
        variant: "default",
        gtin: row.gtin,
        merchantSku: row.externalId,
      },
    });
  }

  const existingOffer = await prisma.offer.findFirst({
    where: {
      merchantId: merchant.id,
      skuId: sku.id,
      affiliateUrl: row.affiliateUrl,
    },
  });

  if (existingOffer) {
    await prisma.offer.update({
      where: { id: existingOffer.id },
      data: {
        priceCents: row.priceCents,
        shippingCents: row.shippingCents,
        currency: row.currency,
        inStock: row.inStock,
        lastSeen: new Date(),
      },
    });

    return;
  }

  await prisma.offer.create({
    data: {
      merchantId: merchant.id,
      skuId: sku.id,
      priceCents: row.priceCents,
      shippingCents: row.shippingCents,
      currency: row.currency,
      inStock: row.inStock,
      affiliateUrl: row.affiliateUrl,
      externalId: row.externalId,
      lastSeen: new Date(),
    },
  });
}

function detectDelimiter(sample: string): "," | ";" | "\t" {
  const counts = {
    comma: (sample.match(/,/g) || []).length,
    semicolon: (sample.match(/;/g) || []).length,
    tab: (sample.match(/\t/g) || []).length,
  };

  if (counts.semicolon >= counts.comma && counts.semicolon >= counts.tab) {
    return ";";
  }

  if (counts.tab >= counts.comma && counts.tab >= counts.semicolon) {
    return "\t";
  }

  return ",";
}

async function readTextFromSource(source: string): Promise<string> {
  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} sur ${source}`);
    }

    return response.text();
  }

  const filePath = path.isAbsolute(source)
    ? source
    : path.join(process.cwd(), source);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Fichier introuvable: ${filePath}`);
  }

  return fs.readFileSync(filePath, "utf-8");
}

async function ingestSource(source: string) {
  console.log(`→ Lecture: ${source}`);

  let text = await readTextFromSource(source);

  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }

  const sample = text.slice(0, 5000);
  const delimiter = detectDelimiter(sample);

  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    delimiter,
    bom: true,
    trim: true,
  }) as RawRow[];

  let parsed = 0;
  let kept = 0;

  for (const row of records) {
    parsed += 1;

    const normalized = normalizeRow(row);

    if (!normalized) continue;

    try {
      await upsertOne(normalized);
      kept += 1;
    } catch (error) {
      console.warn(
        "  ⚠️ Ligne ignorée:",
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  return { parsed, kept };
}

async function main() {
  const rawList = (process.env.KWANKO_FEED_URLS || "data/kwanko_sample.csv")
    .split(",")
    .map((source) => source.trim())
    .filter(Boolean);

  console.log("=== Ingestion Kwanko (CSV) ===");

  const startedAt = new Date();

  let totalParsed = 0;
  let totalKept = 0;

  for (const source of rawList) {
    try {
      const { parsed, kept } = await ingestSource(source);
      console.log(`  ✓ ${source} — ${kept}/${parsed} lignes importées`);

      totalParsed += parsed;
      totalKept += kept;
    } catch (error) {
      console.error(
        `  ✗ ${source} — erreur:`,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  if (totalParsed > 0) {
    const grace = await prisma.offer.updateMany({
      where: { lastSeen: { lt: startedAt } },
      data: { inStock: false },
    });

    console.log(
      `=== Terminé: ${totalKept}/${totalParsed} offres importées; ${grace.count} offres marquées hors stock ===`
    );
  } else {
    console.log(
      `=== Terminé: ${totalKept}/${totalParsed} offres importées; aucune grâce appliquée ===`
    );
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error(error);
    prisma.$disconnect();
    process.exit(1);
  });