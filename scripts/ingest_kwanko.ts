import { PrismaClient } from "@prisma/client";
import { parse } from "csv-parse/sync";
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
  gtin?: string | null;        // EAN/GTIN si dispo
  externalId?: string | null;  // id de l’offre (si dispo)
};

// Essaye plusieurs noms possibles de colonnes selon les flux
function pick(obj: RawRow, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k] ?? obj[k.toLowerCase()];
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  return undefined;
}
function toCents(s?: string): number | null {
  if (!s) return null;
  const n = Number(String(s).replace(",", ".").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

function normalizeRow(row: RawRow, defaultCategory: string): NormRow | null {
  // Champs candidats (ajuste les listes si besoin selon le flux)
  const merchant = pick(row, ["merchant", "merchant_name", "shop", "store"]) ?? "marchand";
  const productName = pick(row, ["product_name", "name", "title"]) ?? "";
  const brand = pick(row, ["brand", "marque"]) ?? "";
  const modelRaw = pick(row, ["model", "product", "title", "name"]) ?? productName;
  const season = pick(row, ["season", "saison"]) ?? null;
  const category = pick(row, ["category", "category_name", "categorie"]) ?? defaultCategory;

  const priceCents = toCents(pick(row, ["price", "price_eur", "price_euros", "sale_price"])) ?? 0;
  const shippingCents = toCents(pick(row, ["shipping_cost", "shipping", "delivery_cost"])) ?? 0;
  const currency = pick(row, ["currency", "devise"]) ?? "EUR";
  const availability = (pick(row, ["availability", "in_stock", "instock", "stock"]) ?? "").toLowerCase();
  const inStock = availability ? /(1|true|yes|en stock|instock|available|disponible)/.test(availability) : true;

  const affiliateUrl =
    pick(row, ["deeplink", "aw_deeplink", "product_url", "url", "link"]) ?? "";

  if (!productName || !affiliateUrl || !priceCents) return null;

  // si brand vide, essayer d’extraire depuis productName (ex. "Atomic Bent 100 2025/26")
  const brandGuess = brand || productName.split(" ")[0] || "Unknown";
  const model = brand ? modelRaw : productName.replace(new RegExp("^" + brandGuess + "\\s+", "i"), "");

  const gtin = pick(row, ["gtin", "ean", "barcode"]) ?? null;
  const externalId = pick(row, ["id", "product_id", "offer_id"]) ?? null;

  return {
    merchant: brandGuess ? merchant : merchant,
    productName,
    brand: brandGuess,
    model,
    season,
    category,
    priceCents,
    shippingCents,
    currency: currency.toUpperCase(),
    inStock,
    affiliateUrl,
    gtin,
    externalId,
  };
}

async function upsertOne(n: NormRow) {
  // 1) Merchant
  const merchantSlug = slugify(n.merchant);
  const merchant = await prisma.merchant.upsert({
    where: { slug: merchantSlug },
    update: { name: n.merchant },
    create: { slug: merchantSlug, name: n.merchant },
  });

  // 2) Product
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

  // 3) Sku
  // Si on a un GTIN, on s’en sert ; sinon on utilise un SKU “default”
  const skuCode = n.gtin ?? "default";
  let sku = await prisma.sku.findFirst({
    where: { productId: product.id, gtin: n.gtin ?? undefined, code: n.gtin ? undefined : "default" },
  });
  if (!sku) {
    sku = await prisma.sku.create({
      data: {
        productId: product.id,
        code: skuCode,
        gtin: n.gtin ?? undefined,
      },
    });
  }

  // 4) Offer
  // On identifie une offre par (merchantId, skuId, affiliateUrl) — c’est simple et robuste pour un MVP
  const existing = await prisma.offer.findFirst({
    where: {
      merchantId: merchant.id,
      skuId: sku.id,
      affiliateUrl: n.affiliateUrl,
    },
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

async function ingestCsv(url: string, defaultCategory: string) {
  console.log(`→ Téléchargement: ${url}`);
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`  ⚠️  HTTP ${res.status} sur ${url}`);
    return { parsed: 0, kept: 0 };
  }
  const text = await res.text();

  // On laisse csv-parse deviner le délimiteur ; sinon, force { delimiter: ';' }
  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    delimiter: undefined,
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
      console.warn("  ⚠️  Ligne ignorée (erreur d’upsert):", (e as Error).message);
    }
  }
  return { parsed, kept };
}

async function main() {
  const urls = (process.env.KWANKO_FEED_URLS || "").split(",").map(s => s.trim()).filter(Boolean);
  if (!urls.length) {
    throw new Error("KWANKO_FEED_URLS est vide. Renseigne une ou plusieurs URLs CSV (séparées par des virgules).");
  }
  const defaultCategory = process.env.KWANKO_DEFAULT_CATEGORY || "skis-all-mountain";

  console.log("=== Ingestion Kwanko (CSV) ===");
  let totalParsed = 0;
  let totalKept = 0;

  for (const u of urls) {
    try {
      const { parsed, kept } = await ingestCsv(u, defaultCategory);
      console.log(`  ✓ ${u} — ${kept}/${parsed} lignes importées`);
      totalParsed += parsed;
      totalKept += kept;
    } catch (e) {
      console.error(`  ✗ ${u} — erreur:`, (e as Error).message);
    }
  }

  console.log(`=== Terminé: ${totalKept}/${totalParsed} offres importées ===`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
