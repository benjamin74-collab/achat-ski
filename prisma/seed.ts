// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

function labelize(slug: string) {
  // "skis-all-mountain" -> "Skis All Mountain" (tu peux ajuster si besoin)
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

async function main() {
  // Marchands
  const ekosport = await prisma.merchant.upsert({
    where: { slug: "ekosport" },
    update: {},
    create: { name: "Ekosport", slug: "ekosport", network: "kwanko", status: "active" },
  });
  const snowleader = await prisma.merchant.upsert({
    where: { slug: "snowleader" },
    update: {},
    create: { name: "Snowleader", slug: "snowleader", network: "sovrn", status: "active" },
  });
  const glisshop = await prisma.merchant.upsert({
    where: { slug: "glisshop" },
    update: {},
    create: { name: "Glisshop", slug: "glisshop", network: "kwanko", status: "active" },
  });

  // 10 produits de démo
  // [brand, model, season, categorySlug, productSlug]
  const products: Array<[string, string, string, string, string]> = [
    ["Atomic", "Bent 100", "2025/26", "skis-all-mountain", "atomic-bent-100-2025-26"],
    ["Salomon", "QST 98", "2025/26", "skis-all-mountain", "salomon-qst-98-2025-26"],
    ["Rossignol", "Experience 82 Ti", "2025/26", "skis-all-mountain", "rossignol-experience-82-ti-2025-26"],
    ["Dynastar", "M-Pro 90", "2025/26", "skis-all-mountain", "dynastar-m-pro-90-2025-26"],
    ["Black Crows", "Camox", "2025/26", "skis-all-mountain", "black-crows-camox-2025-26"],
    ["Elan", "Ripstick 96", "2025/26", "skis-all-mountain", "elan-ripstick-96-2025-26"],
    ["Head", "Kore 93", "2025/26", "skis-all-mountain", "head-kore-93-2025-26"],
    ["Faction", "Dancer 2", "2025/26", "skis-all-mountain", "faction-dancer-2-2025-26"],
    ["K2", "Mindbender 99 Ti", "2025/26", "skis-all-mountain", "k2-mindbender-99-ti-2025-26"],
    ["Nordica", "Enforcer 94", "2025/26", "skis-all-mountain", "nordica-enforcer-94-2025-26"],
  ];

  for (const [brand, model, season, categorySlug, slug] of products) {
    const description =
      `${brand} ${model} ${season ?? ""} — Ski all-mountain polyvalent ` +
      `pensé pour enchaîner pistes et bords de piste. Stabilité et accroche à vitesse élevée, ` +
      `avec un comportement joueur en neige transformée. Idéal pour un skieur intermédiaire à expert.`;

    // Produit + relation catégorie (connectOrCreate via slug)
    const p = await prisma.product.upsert({
      where: { slug },
      update: {
        brand,
        model,
        season,
        description,
        category: categorySlug
          ? {
              connectOrCreate: {
                where: { slug: categorySlug },
                create: {
                  slug: categorySlug,
                  name: labelize(categorySlug),
                  published: true,
                  isInMenu: true,
                  order: 0,
                },
              },
            }
          : undefined,
      },
      create: {
        brand,
        model,
        season,
        description,
        slug,
        category: categorySlug
          ? {
              connectOrCreate: {
                where: { slug: categorySlug },
                create: {
                  slug: categorySlug,
                  name: labelize(categorySlug),
                  published: true,
                  isInMenu: true,
                  order: 0,
                },
              },
            }
          : undefined,
      },
    });

    // Deux SKUs de démo
    const sku172 = await prisma.sku.upsert({
      where: { gtin: `${slug}-172` },
      update: {},
      create: { productId: p.id, variant: "172 cm", gtin: `${slug}-172` },
    });
    const sku180 = await prisma.sku.upsert({
      where: { gtin: `${slug}-180` },
      update: {},
      create: { productId: p.id, variant: "180 cm", gtin: `${slug}-180` },
    });

    // Offres démo : ekosport / snowleader / glisshop
    const base = 399 + Math.floor(Math.random() * 250); // 399–649 €
    for (const sku of [sku172, sku180]) {
      await prisma.offer.upsert({
        where: { skuId_merchantId: { skuId: sku.id, merchantId: ekosport.id } },
        update: { priceCents: base * 100, affiliateUrl: `https://example.com/ekosport/${slug}` },
        create: {
          skuId: sku.id,
          merchantId: ekosport.id,
          priceCents: base * 100,
          currency: "EUR",
          affiliateUrl: `https://example.com/ekosport/${slug}`,
          inStock: true,
          shippingCents: 0,
        },
      });
      await prisma.offer.upsert({
        where: { skuId_merchantId: { skuId: sku.id, merchantId: snowleader.id } },
        update: { priceCents: (base + 10) * 100, affiliateUrl: `https://example.com/snowleader/${slug}` },
        create: {
          skuId: sku.id,
          merchantId: snowleader.id,
          priceCents: (base + 10) * 100,
          currency: "EUR",
          affiliateUrl: `https://example.com/snowleader/${slug}`,
          inStock: true,
          shippingCents: 1500,
        },
      });
      await prisma.offer.upsert({
        where: { skuId_merchantId: { skuId: sku.id, merchantId: glisshop.id } },
        update: { priceCents: (base - 5) * 100, affiliateUrl: `https://example.com/glisshop/${slug}` },
        create: {
          skuId: sku.id,
          merchantId: glisshop.id,
          priceCents: (base - 5) * 100,
          currency: "EUR",
          affiliateUrl: `https://example.com/glisshop/${slug}`,
          inStock: true,
          shippingCents: 990,
        },
      });
    }

    // Avis utilisateurs (Review) — 2 à 3 avis random par produit
    const reviewPool = [
      {
        rating: 5,
        title: "Super accroche sur neige dure",
        body: "Rassurant à haute vitesse, tient très bien le cap. Polyvalent toute la journée.",
        authorName: "Alex",
        sourceName: "Utilisateur",
      },
      {
        rating: 4,
        title: "Joueur mais reste stable",
        body: "Un bon compromis piste/bord de piste, pas fatiguant, très fun.",
        authorName: "Sam",
        sourceName: "Utilisateur",
      },
      {
        rating: 3,
        title: "Bien mais demande un peu de vitesse",
        body: "À basse vitesse, ça manque un poil de nervosité. Sinon top quand on appuie.",
        authorName: "Léo",
        sourceName: "Utilisateur",
      },
    ];
    const pick = (n: number) => reviewPool.sort(() => Math.random() - 0.5).slice(0, n);

    await prisma.review.createMany({
      data: pick(2 + (Math.random() > 0.5 ? 1 : 0)).map((r) => ({
        productId: p.id,
        rating: r.rating,
        title: r.title,
        body: r.body,
        authorName: r.authorName,
        sourceName: r.sourceName,
      })),
      skipDuplicates: true,
    });

    // Tests rédactionnels (EditorialTest) — 1 à 2 fiches par produit
    const tests = [
      {
        title: `${brand} ${model} : le test Skipass`,
        excerpt: "Un ski stable et joueur, avec une belle marge de progression. Polyvalent en toutes conditions.",
        score: 8.5,
        sourceName: "Skipass",
        sourceUrl: "https://www.skipass.com/",
      },
      {
        title: `${brand} ${model} : Backcountry Magazine`,
        excerpt: "Bonne accroche sur neige dure et excellent comportement en trafollée. Un all-mountain abouti.",
        score: 4.2, // sur 5, c’est un exemple
        sourceName: "Backcountry Magazine",
        sourceUrl: "https://backcountrymagazine.com/",
      },
    ].slice(0, Math.random() > 0.5 ? 2 : 1);

    await prisma.editorialTest.createMany({
      data: tests.map((t) => ({
        productId: p.id,
        title: t.title,
        excerpt: t.excerpt,
        score: t.score,
        sourceName: t.sourceName,
        sourceUrl: t.sourceUrl,
      })),
      skipDuplicates: true,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
