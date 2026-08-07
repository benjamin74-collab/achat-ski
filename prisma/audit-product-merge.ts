// prisma/audit-product-merge.ts
import { prisma } from "../src/lib/prisma";

type CliOptions = {
  siteId: string;
  brand: string | null;
  limit: number | null;
  top: number;
};

const DEFAULT_SITE_ID = "meilleur-ski";

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    siteId: process.env.SITE_ID || DEFAULT_SITE_ID,
    brand: null,
    limit: null,
    top: 50,
  };

  for (const arg of argv) {
    if (arg.startsWith("--site=")) options.siteId = arg.replace("--site=", "").trim();
    if (arg.startsWith("--brand=")) options.brand = arg.replace("--brand=", "").trim();
    if (arg.startsWith("--limit=")) {
      const value = Number(arg.replace("--limit=", "").trim());
      if (Number.isInteger(value) && value > 0) options.limit = value;
    }
    if (arg.startsWith("--top=")) {
      const value = Number(arg.replace("--top=", "").trim());
      if (Number.isInteger(value) && value > 0) options.top = value;
    }
  }

  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  console.log("");
  console.log("============================================================");
  console.log("Audit fusion produits / offres");
  console.log("============================================================");
  console.log(`Site  : ${options.siteId}`);
  console.log(`Marque: ${options.brand ?? "toutes"}`);
  console.log(`Limit : ${options.limit ?? "aucune"}`);
  console.log("============================================================");
  console.log("");

  const products = await prisma.product.findMany({
    where: {
      active: true,
      published: true,
      ...(options.brand
        ? {
            brand: {
              contains: options.brand,
              mode: "insensitive",
            },
          }
        : {}),
      sites: {
        some: {
          siteId: options.siteId,
          active: true,
          published: true,
        },
      },
    },
    orderBy: {
      id: "asc",
    },
    take: options.limit ?? undefined,
    select: {
      id: true,
      slug: true,
      name: true,
      model: true,
      brand: true,
      gtin: true,
      manufacturerReference: true,
      attributes: true,
      category: {
        select: {
          slug: true,
          name: true,
        },
      },
      offers: {
        where: {
          active: true,
        },
        orderBy: {
          id: "asc",
        },
        select: {
          id: true,
          externalId: true,
          parentExternalId: true,
          merchantProductUrl: true,
          affiliateUrl: true,
          priceCents: true,
          oldPriceCents: true,
          imageUrl: true,
          active: true,
          merchant: {
            select: {
              slug: true,
              name: true,
            },
          },
        },
      },
    },
  });

  const multiOfferProducts = products
    .filter((product) => product.offers.length > 1)
    .sort((a, b) => b.offers.length - a.offers.length);

  const productsWithoutOffer = products.filter((product) => product.offers.length === 0);

  const duplicateGroups = dedupeGroups([
    ...buildGroups(products, "gtin"),
    ...buildGroups(products, "manufacturer"),
    ...buildGroups(products, "name"),
  ]).sort((a, b) => {
    if (b.productCount !== a.productCount) return b.productCount - a.productCount;
    return b.offerCount - a.offerCount;
  });

  const genericNameProducts = products
    .filter((product) => isGenericName(product.name, product.brand))
    .slice(0, options.top);

  console.log("Résumé");
  console.table([
    { metric: "Produits analysés", value: products.length },
    { metric: "Produits avec plusieurs offres", value: multiOfferProducts.length },
    { metric: "Produits sans offre active", value: productsWithoutOffer.length },
    { metric: "Groupes doublons potentiels", value: duplicateGroups.length },
    { metric: "Noms trop génériques potentiels", value: genericNameProducts.length },
  ]);

  console.log("");
  console.log("Top produits avec plusieurs offres");
  console.table(
    multiOfferProducts.slice(0, options.top).map((product) => ({
      id: product.id,
      brand: product.brand,
      name: product.name,
      offers: product.offers.length,
      merchants: uniq(product.offers.map((offer) => offer.merchant.slug)).join(", "),
      category: product.category?.slug ?? "",
    }))
  );

  console.log("");
  console.log("Doublons potentiels à fusionner");
  console.table(
    duplicateGroups.slice(0, options.top).map((group) => ({
      reason: group.reason,
      products: group.productCount,
      offers: group.offerCount,
      merchants: group.merchantCount,
      ids: group.productIds.join(", "),
      names: group.productNames.slice(0, 3).join(" | "),
      merchantList: group.merchants.join(", "),
    }))
  );

  console.log("");
  console.log("Noms trop génériques potentiels");
  console.table(
    genericNameProducts.map((product) => ({
      id: product.id,
      brand: product.brand,
      name: product.name,
      model: product.model,
      offers: product.offers.length,
      merchants: uniq(product.offers.map((offer) => offer.merchant.slug)).join(", "),
      category: product.category?.slug ?? "",
    }))
  );

  const report = {
    generatedAt: new Date().toISOString(),
    siteId: options.siteId,
    brand: options.brand,
    counts: {
      products: products.length,
      multiOfferProducts: multiOfferProducts.length,
      productsWithoutOffer: productsWithoutOffer.length,
      duplicateGroups: duplicateGroups.length,
      genericNameProducts: genericNameProducts.length,
    },
    multiOfferProducts: multiOfferProducts.slice(0, 500).map(productToReport),
    duplicateGroups: duplicateGroups.slice(0, 500),
    genericNameProducts: genericNameProducts.slice(0, 500).map(productToReport),
  };

  const fs = await import("node:fs/promises");
  const path = await import("node:path");

  const outputDir = path.join(process.cwd(), "prisma", "audit-data");
  await fs.mkdir(outputDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const brandPart = options.brand ? `-${slugify(options.brand)}` : "";
  const outputPath = path.join(outputDir, `product-merge-audit${brandPart}-${stamp}.json`);

  await fs.writeFile(outputPath, JSON.stringify(report, null, 2), "utf8");

  console.log("");
  console.log(`Rapport JSON : ${outputPath}`);
  console.log("");

  await prisma.$disconnect();
}

function buildGroups(products: any[], type: "gtin" | "manufacturer" | "name") {
  const map = new Map<string, any[]>();

  for (const product of products) {
    const key = getKey(product, type);
    if (!key) continue;

    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(product);
  }

  const groups: any[] = [];

  for (const [key, rows] of map.entries()) {
    if (rows.length < 2) continue;

    groups.push({
      key,
      reason:
        type === "gtin"
          ? "GTIN identique"
          : type === "manufacturer"
            ? "Marque + référence fabricant identiques"
            : "Marque + nom normalisé identiques",
      productCount: rows.length,
      offerCount: rows.reduce((sum, product) => sum + product.offers.length, 0),
      merchantCount: uniq(rows.flatMap((product) => product.offers.map((offer: any) => offer.merchant.slug))).length,
      productIds: rows.map((product) => product.id),
      productNames: uniq(rows.map((product) => product.name)),
      productSlugs: rows.map((product) => product.slug),
      merchants: uniq(rows.flatMap((product) => product.offers.map((offer: any) => offer.merchant.slug))),
      gtins: uniq(rows.map((product) => product.gtin).filter(Boolean)),
      manufacturerReferences: uniq(rows.map((product) => product.manufacturerReference).filter(Boolean)),
    });
  }

  return groups;
}

function getKey(product: any, type: "gtin" | "manufacturer" | "name"): string | null {
  const brandKey = normalizeKey(product.brand);

  if (type === "gtin") {
    const gtin = String(product.gtin ?? "").replace(/\D/g, "");
    return gtin ? `gtin:${gtin}` : null;
  }

  if (type === "manufacturer") {
    const ref = normalizeReference(product.manufacturerReference);
    if (!brandKey || !ref) return null;
    return `manufacturer:${brandKey}:${ref}`;
  }

  const normalizedName = normalizeName(product.name, product.brand);

  if (!brandKey || !normalizedName || isTooGeneric(normalizedName)) return null;

  return `name:${brandKey}:${normalizedName}`;
}

function dedupeGroups(groups: any[]) {
  const seen = new Set<string>();
  const result: any[] = [];

  for (const group of groups) {
    const key = [...group.productIds].sort((a: number, b: number) => a - b).join(",");
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(group);
  }

  return result;
}

function productToReport(product: any) {
  return {
    id: product.id,
    slug: product.slug,
    brand: product.brand,
    name: product.name,
    model: product.model,
    gtin: product.gtin,
    manufacturerReference: product.manufacturerReference,
    category: product.category,
    offers: product.offers.map((offer: any) => ({
      id: offer.id,
      merchant: offer.merchant.slug,
      externalId: offer.externalId,
      parentExternalId: offer.parentExternalId,
      priceCents: offer.priceCents,
      merchantProductUrl: offer.merchantProductUrl,
      imageUrl: offer.imageUrl,
    })),
    attributes: product.attributes,
  };
}

function isGenericName(name: string | null | undefined, brand: string | null | undefined): boolean {
  return isTooGeneric(normalizeName(name, brand));
}

function isTooGeneric(normalized: string): boolean {
  if (!normalized) return true;

  const exact = new Set([
    "blouson",
    "veste",
    "veste ski",
    "veste snowboard",
    "veste ski snowboard",
    "pantalon",
    "pantalon ski",
    "pantalon snowboard",
    "pantalon ski snowboard",
    "tee shirt",
    "t shirt",
    "sweat",
    "pull",
    "doudoune",
    "polaire",
    "casque",
    "masque",
    "gant",
    "gants",
    "sac",
    "housse",
    "chaussures",
    "chaussure",
    "fixation",
    "fixations",
    "ski",
    "snowboard",
  ]);

  if (exact.has(normalized)) return true;

  const words = normalized.split(" ").filter(Boolean);
  if (words.length > 2) return false;

  const genericWords = new Set([
    "blouson",
    "veste",
    "pantalon",
    "casque",
    "masque",
    "gant",
    "gants",
    "sac",
    "housse",
    "ski",
    "snowboard",
    "homme",
    "femme",
    "enfant",
    "junior",
  ]);

  return words.every((word) => genericWords.has(word));
}

function normalizeName(value: string | null | undefined, brand: string | null | undefined): string {
  let normalized = normalizeText(value)
    .toLowerCase()
    .replace(/[’']/g, " ")
    .replace(/&/g, " ")
    .replace(/\+/g, " ")
    .replace(/[-_/|]+/g, " ")
    .replace(/\bde\b/g, " ")
    .replace(/\bdu\b/g, " ")
    .replace(/\bdes\b/g, " ")
    .replace(/\bpour\b/g, " ")
    .replace(/\bet\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const brandParts = normalizeText(brand).toLowerCase().split(/\s+/).filter(Boolean);

  for (const part of brandParts) {
    normalized = normalized.replace(new RegExp(`^${escapeRegExp(part)}\\s+`, "i"), "").trim();
  }

  return normalized
    .replace(/\borganic\b/g, "")
    .replace(/\bclothing\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value: string | null | undefined): string {
  if (!value) return "";

  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&amp;/gi, "&")
    .replace(/&#039;/g, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeKey(value: string | null | undefined): string {
  return normalizeText(value)
    .toLowerCase()
    .replace(/^the\s+/i, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function normalizeReference(value: string | null | undefined): string {
  return normalizeText(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .trim();
}

function slugify(value: string | null | undefined): string {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

function uniq(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

main().catch(async (error) => {
  console.error("");
  console.error("Erreur audit fusion produits :");
  console.error(error);
  console.error("");

  await prisma.$disconnect();
  process.exit(1);
});
