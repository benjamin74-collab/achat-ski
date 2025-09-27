// scripts/ingest_kwanko.ts
import fs from "node:fs";
import path from "node:path";
import { prisma } from "../src/lib/prisma";



// === DEBUG SQL Prisma ===
prisma.$on("query", (e) => {
  console.log("\n--- PRISMA SQL ---");
  console.log(e.query);
  console.log("PARAMS:", e.params);
  console.log("--- /PRISMA SQL ---\n");
});


// Petit slugify fiable
function slugify(s: string) {
  return s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

type Row = {
  merchant_id: string;
  merchant_name: string;
  product_id: string;
  product_name: string;
  category: string;
  brand: string;
  model: string;
  season?: string;
  price: string;
  url: string;
  image_url?: string;
};

type NormRow = {
  merchant: string;
  merchantSlug: string;
  brand: string;
  model: string;
  season?: string;
  category?: string;
  priceCents: number;
  currency: string;
  affiliateUrl: string;
  inStock: boolean;
  shippingCents: number | null;
  gtin?: string | null; // si un jour ton CSV en a
};

function parseCsv(file: string): Row[] {
  const raw = fs.readFileSync(file, "utf8");
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const header = lines.shift()!;
  const cols = header.split(",").map((c) => c.trim());
  const out: Row[] = [];

  for (const line of lines) {
    const parts = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"' ) {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        parts.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
    parts.push(current);

    const o: any = {};
    cols.forEach((c, i) => (o[c] = (parts[i] ?? "").trim()));
    out.push(o as Row);
  }
  return out;
}

function normalize(r: Row): NormRow {
  const priceCents = Math.round(parseFloat(r.price) * 100);
  return {
    merchant: r.merchant_name || r.merchant_id,
    merchantSlug: slugify(r.merchant_name || r.merchant_id),
    brand: r.brand,
    model: r.model,
    season: r.season || undefined,
    category: r.category || undefined,
    priceCents,
    currency: "EUR",
    affiliateUrl: r.url,
    inStock: true,
    shippingCents: null,
    gtin: null,
  };
}

async function upsertOne(n: NormRow) {
  // 1) Merchant
  let merchant = await prisma.merchant.findUnique({
    where: { slug: n.merchantSlug },
    select: { id: true, slug: true, name: true },
  });

  if (!merchant) {
    merchant = await prisma.merchant.create({
      data: { slug: n.merchantSlug, name: n.merchant },
      select: { id: true, slug: true, name: true },
    });
  } else if (merchant.name !== n.merchant) {
    merchant = await prisma.merchant.update({
      where: { id: merchant.id },
      data: { name: n.merchant },
      select: { id: true, slug: true, name: true },
    });
  }

// 2) Product
const productSlug = slugify([n.brand, n.model, n.season ?? ""].filter(Boolean).join(" "));

let product = await prisma.product.findUnique({
  where: { slug: productSlug },
  select: { id: true, slug: true },
});

if (!product) {
  const productData = {
    slug: productSlug,
    brand: n.brand,
    model: n.model,
    season: n.season ?? undefined,
    category: n.category ?? undefined,
  } as const;

  console.log("PRODUCT.CREATE KEYS:", Object.keys(productData));

  product = await prisma.product.create({
    data: productData,
    select: { id: true, slug: true },
  });
} else {
  const updateData = {
    brand: n.brand,
    model: n.model,
    season: n.season ?? undefined,
    category: n.category ?? undefined,
  } as const;

  console.log("PRODUCT.UPDATE KEYS:", Object.keys(updateData));

  await prisma.product.update({
    where: { id: product.id },
    data: updateData,
    select: { id: true }, // on ignore le retour
  });
}


  // 3) SKU (gtin si dispo, sinon variant="default")
  const variant = n.gtin ? undefined : "default";
  let sku = await prisma.sku.findFirst({
    where: {
      productId: product.id,
      OR: [
        ...(n.gtin ? [{ gtin: n.gtin }] : []),
        ...(variant ? [{ variant }] : []),
      ],
    },
    select: { id: true },
  });

  if (!sku) {
    sku = await prisma.sku.create({
      data: {
        productId: product.id,
        gtin: n.gtin ?? undefined,
        variant: variant,
      },
      select: { id: true },
    });
  }

  // 4) Offer
  const existing = await prisma.offer.findFirst({
    where: { skuId: sku.id, merchantId: merchant.id },
    select: { id: true },
  });

  if (existing) {
    await prisma.offer.update({
      where: { id: existing.id },
      data: {
        affiliateUrl: n.affiliateUrl,
        priceCents: n.priceCents,
        shippingCents: n.shippingCents,
        currency: n.currency,
        inStock: n.inStock,
        lastSeen: new Date(),
      },
      select: { id: true },
    });
  } else {
    await prisma.offer.create({
      data: {
        skuId: sku.id,
        merchantId: merchant.id,
        affiliateUrl: n.affiliateUrl,
        priceCents: n.priceCents,
        shippingCents: n.shippingCents,
        currency: n.currency,
        inStock: n.inStock,
        lastSeen: new Date(),
      },
      select: { id: true },
    });
  }
}

async function main() {
  console.log("=== Ingestion Kwanko (CSV) ===");
  const list = (process.env.KWANKO_FEED_URLS || "").split(/[;,]/).map(s => s.trim()).filter(Boolean);
  if (list.length === 0) {
    // fallback local
    list.push("data\\kwanko_sample.csv");
  }

  for (const p of list) {
    const file = path.resolve(p);
    if (!fs.existsSync(file)) {
      console.log(`  ✗ ${p} — fichier introuvable`);
      continue;
    }
    console.log(`→ Lecture: ${p}`);
    const rows = parseCsv(file);
    let ok = 0, total = 0;
    for (const r of rows) {
      total++;
      try {
        const n = normalize(r);
        await upsertOne(n);
        ok++;
      } catch (e) {
        console.log("  ⚠️  Ligne ignorée:");
        console.error(String(e));
      }
    }
    console.log(`  ✓ ${p} — ${ok}/${total} lignes importées`);
  }
  console.log("=== Terminé ===");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
