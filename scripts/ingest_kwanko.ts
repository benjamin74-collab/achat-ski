// @ts-nocheck
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
  category?: string | null;
  priceCents: number;
  shippingCents: number | null;
  currency: string;
  inStock: boolean;
  affiliateUrl: string;
  gtin?: string | null;
  externalId?: string | null;
};

function pick(obj: RawRow, keys: string[]): string | undefined {
  for (const k of keys) {
    const direct = obj[k];
    if (direct != null && String(direct).trim() !== "") return String(direct).trim();
    const lower = obj[k.toLowerCase()];
    if (lower != null && String(lower).trim() !== "") return String(lower).trim();
  }
  return undefined;
}

function toCents(s?: string): number | null {
  if (!s) return null;
  const cleaned = String(s).replace(/\s/g, "").replace(",", ".").replace(/[^\d.]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

function titleCaseBrand(s: string) {
  if (!s) return s;
  const lower = s.toLowerCase();
  if (lower.length <= 4) return s.toUpperCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function normalizeRow(row: RawRow, defaultCategory: string): NormRow | null {
  const merchant = pick(row, ["merchant", "merchant_name", "shop", "store", "retailer"]) ?? "marchand";
  const productName = pick(row, ["product_name", "name", "title"]) ?? "";
  const brandRaw = pick(row, ["brand", "marque"]) ?? "";
  const brand = brandRaw ? titleCaseBrand(brandRaw) : brandRaw;
  const modelRaw = pick(row, ["model", "product", "title", "name"]) ?? productName;
  const season = pick(row, ["season", "saison"]) ?? null;
  const category = pick(row, ["category", "category_name", "categorie"]) ?? defaultCategory;

  const priceCents = toCents(pick(row, ["price", "price_eur", "price_euros", "sale_price"])) ?? 0;
  const shippingCents = toCents(pick(row, ["shipping_cost", "shipping", "delivery_cost"])) ?? 0;
  const currency = (pick(row, ["currency", "devise"]) ?? "EUR").toUpperCase();
  const availability = (pick(row, ["availability", "in_stock", "instock", "stock"]) ?? "").toLowerCase();
  const inStock = availability ? /(1|true|yes|enstock|instock|available|disponible|oui)/.test(availability) : true;

  const affiliateUrl = pick(row, ["deeplink", "aw_deeplink", "product_url", "url", "link"]) ?? "";
  if (!productName || !affiliateUrl || !priceCents) return null;

  const inferredBrand = brand || (productName.split(" ")[0] || "Unknown");
  const model = brand ? modelRaw : productName.replace(new RegExp("^" + inferredBrand + "\\s+", "i"), "");

  const gtin = pick(row, ["gtin", "ean", "barcode"]) ?? null;
  const externalId = pick(row, ["id", "product_id", "offer_id", "sku"]) ?? null;

  return {
    merchant,
    productName,
    brand: inferredBrand,
    model,
    season,
    category,
    priceCents,
    shippingCents,
    currency,
    inStock,
    affiliateUrl,
    gtin,
    externalId,
  };
}

async function upsertOne(n: NormRow) {
  // 1) Marchand
  const merchantSlug = slugify(n.merchant);
  const merchant = await prisma.merchant.upsert({
    where: { slug: merchantSlug },
    update: { name: n.merchant },
    create: { slug: merchantSlug, name: n.merchant },
  });

  // 2) Produit
  const productSlug = slugify([n.brand, n.model, n.season ?? ""].filter(Boolean).join(" "));
  const product = await prisma.product.upsert({
    where: { slug: productSlug },
    update: {
      brand: n.brand,
      model: n.model,
      season: n.season,
      category: n.category ?? null,
    },
    create: {
      slug: productSlug,
      brand: n.brand,
      model: n.model,
      season: n.season,
      category: n.category ?? null,
    },
  });

  // 3) SKU
  // Ton schéma a: id, variant?, gtin?, attributes?, productId...
  // → on utilise gtin si dispo, sinon variant="default"
  let sku = await prisma.sku.findFirst({
    where: {
      productId: product.id,
      ...(n.gtin ? { gtin: n.gtin } : { variant: "default" }),
    },
  });

  if (!sku) {
    sku = await prisma.sku.create({
      data: {
        productId: product.id,
        ...(n.gtin ? { gtin: n.gtin } : { variant: "default" }),
      },
    });
  }

  // 4) Offre (clé MVP: merchantId + skuId + affiliateUrl)
  const existing = await prisma.offer.findFirst({
    where: { merchantId: merchant.id, skuId: sku.id, affiliateUrl: n.affiliateUrl },
  });

  if (existing) {
    await prisma.offer.update({
      where: { id: existing.id },
      data: {
        priceCents: n.priceCents,
        shippingCents: n.shippingCents,
        currency: n.currency,
        inStock: n.inStock,
        lastSeen: new Date(),
      },
    });
  } else {
    await prisma.offer.create({
      data: {
        merchantId: merchant.id,
        skuId: sku.id,
        priceCents: n.priceCents,
        shippingCents: n.shippingCents,
        currency: n.currency,
        inStock: n.inStock,
        affiliateUrl: n.affiliateUrl,
        lastSeen: new Date(),
      },
    });
  }
}

function detectDelimiter(sample: string): "," | ";" | "\t" {
  const counts = {
    comma: (sample.match(/,/g) || []).length,
    semicolon: (sample.match(/;/g) || []).length,
    tab: (sample.match(/\t/g) || []).length,
  };
  if (counts.semicolon >= counts.comma && counts.semicolon >= counts.tab) return ";";
  if (counts.tab >= counts.comma && counts.tab >= counts.semicolon) return "\t";
  return ",";
}

function readTextFromSource(src: string): Promise<string> {
  if (/^https?:\/\//i.test(src)) {
    return fetch(src).then(async (r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status} sur ${src}`);
      return r.text();
    });
  }
  const p = path.isAbsolute(src) ? src : path.join(process.cwd(), src);
  if (!fs.existsSync(p)) {
    throw new Error(`Fichier introuvable: ${p}`);
  }
  return Promise.resolve(fs.readFileSync(p, "utf-8"));
}

async function ingestSource(source: string, defaultCategory: string) {
  console.log(`→ Lecture: ${source}`);
  let text = await readTextFromSource(source);

  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
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
    parsed++;
    const norm = normalizeRow(row, defaultCategory);
    if (!norm) continue;
    try {
      await upsertOne(norm);
      kept++;
    } catch (e) {
      console.warn("  ⚠️  Ligne ignorée:", (e as Error).message);
    }
  }
  return { parsed, kept };
}

async function main() {
  const rawList = (process.env.KWANKO_FEED_URLS || "data/kwanko_sample.csv")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const defaultCategory = process.env.KWANKO_DEFAULT_CATEGORY || "skis-all-mountain";

  console.log("=== Ingestion Kwanko (CSV) ===");
  const startedAt = new Date();

  let totalParsed = 0;
  let totalKept = 0;

  for (const src of rawList) {
    try {
      const { parsed, kept } = await ingestSource(src, defaultCategory);
      console.log(`  ✓ ${src} — ${kept}/${parsed} lignes importées`);
      totalParsed += parsed;
      totalKept += kept;
    } catch (e) {
      console.error(`  ✗ ${src} — erreur:`, (e as Error).message);
    }
  }

  if (totalParsed > 0) {
    const grace = await prisma.offer.updateMany({
      where: { lastSeen: { lt: startedAt } },
      data: { inStock: false },
    });
    console.log(`=== Terminé: ${totalKept}/${totalParsed} offres importées; ${grace.count} offres marquées hors stock ===`);
  } else {
    console.log(`=== Terminé: ${totalKept}/${totalParsed} offres importées; aucune grâce appliquée (aucune source valide) ===`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
