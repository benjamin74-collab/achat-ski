import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Marchands
  const ekosport = await prisma.merchant.upsert({
    where: { slug: "ekosport" }, update: {},
    create: { name: "Ekosport", slug: "ekosport", network: "kwanko", status: "active" },
  });
  const snowleader = await prisma.merchant.upsert({
    where: { slug: "snowleader" }, update: {},
    create: { name: "Snowleader", slug: "snowleader", network: "sovrn", status: "active" },
  });
  const glisshop = await prisma.merchant.upsert({
    where: { slug: "glisshop" }, update: {},
    create: { name: "Glisshop", slug: "glisshop", network: "kwanko", status: "active" },
  });

  // 10 produits de démo
  const products: Array<[string,string,string,string,string]> = [
    ["Atomic","Bent 100","2025/26","skis-all-mountain","atomic-bent-100-2025-26"],
    ["Salomon","QST 98","2025/26","skis-all-mountain","salomon-qst-98-2025-26"],
    ["Rossignol","Experience 82 Ti","2025/26","skis-all-mountain","rossignol-experience-82-ti-2025-26"],
    ["Dynastar","M-Pro 90","2025/26","skis-all-mountain","dynastar-m-pro-90-2025-26"],
    ["Black Crows","Camox","2025/26","skis-all-mountain","black-crows-camox-2025-26"],
    ["Elan","Ripstick 96","2025/26","skis-all-mountain","elan-ripstick-96-2025-26"],
    ["Head","Kore 93","2025/26","skis-all-mountain","head-kore-93-2025-26"],
    ["Faction","Dancer 2","2025/26","skis-all-mountain","faction-dancer-2-2025-26"],
    ["K2","Mindbender 99 Ti","2025/26","skis-all-mountain","k2-mindbender-99-ti-2025-26"],
    ["Nordica","Enforcer 94","2025/26","skis-all-mountain","nordica-enforcer-94-2025-26"],
  ];

  for (const [brand, model, season, category, slug] of products) {
    const p = await prisma.product.upsert({
      where: { slug }, update: {},
      create: { brand, model, season, category, slug },
    });

    const sku172 = await prisma.sku.upsert({
      where: { gtin: `${slug}-172` }, update: {},
      create: { productId: p.id, variant: "172 cm", gtin: `${slug}-172` },
    });
    const sku180 = await prisma.sku.upsert({
      where: { gtin: `${slug}-180` }, update: {},
      create: { productId: p.id, variant: "180 cm", gtin: `${slug}-180` },
    });

    const base = 399 + Math.floor(Math.random() * 250); // 399–649 €
    for (const sku of [sku172, sku180]) {
      await prisma.offer.upsert({
        where: { skuId_merchantId: { skuId: sku.id, merchantId: ekosport.id } },
        update: { priceCents: base * 100, affiliateUrl: `https://example.com/ekosport/${slug}` },
        create: {
          skuId: sku.id, merchantId: ekosport.id,
          priceCents: base * 100, currency: "EUR",
          affiliateUrl: `https://example.com/ekosport/${slug}`,
          inStock: true, shippingCents: 0
        }
      });
      await prisma.offer.upsert({
        where: { skuId_merchantId: { skuId: sku.id, merchantId: snowleader.id } },
        update: { priceCents: (base + 10) * 100, affiliateUrl: `https://example.com/snowleader/${slug}` },
        create: {
          skuId: sku.id, merchantId: snowleader.id,
          priceCents: (base + 10) * 100, currency: "EUR",
          affiliateUrl: `https://example.com/snowleader/${slug}`,
          inStock: true, shippingCents: 1500
        }
      });
      await prisma.offer.upsert({
        where: { skuId_merchantId: { skuId: sku.id, merchantId: glisshop.id } },
        update: { priceCents: (base - 5) * 100, affiliateUrl: `https://example.com/glisshop/${slug}` },
        create: {
          skuId: sku.id, merchantId: glisshop.id,
          priceCents: (base - 5) * 100, currency: "EUR",
          affiliateUrl: `https://example.com/glisshop/${slug}`,
          inStock: true, shippingCents: 990
        }
      });
    }
  }
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
