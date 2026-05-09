// scripts/create-test-product.ts
import { PrismaClient } from "@prisma/client";
import { slugify } from "../src/lib/slug";

const prisma = new PrismaClient();

async function main() {
  const brand = await prisma.brand.upsert({
    where: { slug: "rossignol" },
    update: {
      active: true,
    },
    create: {
      name: "Rossignol",
      slug: "rossignol",
      websiteUrl: "https://www.rossignol.com",
      active: true,
      description:
        "<p>Rossignol est une marque emblématique du ski, reconnue pour ses skis de piste, all-mountain, freeride et randonnée.</p>",
      metaTitle: "Rossignol : skis, chaussures et matériel au meilleur prix",
      metaDescription:
        "Découvrez les produits Rossignol et comparez les prix chez les marchands partenaires.",
    },
  });

  const category = await prisma.category.findUnique({
    where: { slug: "skis-all-mountain" },
    select: { id: true, slug: true, name: true },
  });

  if (!category) {
    throw new Error(
      'Catégorie introuvable : "skis-all-mountain". Vérifie le slug exact dans ton backoffice.',
    );
  }

  const productTitle = "Rossignol Arcade 84 Open 2026";
  const productSlug = slugify(productTitle);

  const product = await prisma.product.upsert({
    where: { slug: productSlug },
    update: {
      brand: brand.name,
      brandId: brand.id,
      model: "Arcade 84 Open",
      season: "2026",
      categoryId: category.id,
      description:
        "Le Rossignol Arcade 84 Open 2026 est un ski all-mountain polyvalent pensé pour les skieurs intermédiaires à confirmés qui veulent conserver de la précision sur piste tout en gardant de l’aisance dans les neiges plus variables. Sa largeur au patin permet d’alterner carving, bords de piste et passages en neige souple avec un bon équilibre entre accroche, stabilité et maniabilité.",
    },
    create: {
      brand: brand.name,
      brandId: brand.id,
      model: "Arcade 84 Open",
      season: "2026",
      slug: productSlug,
      categoryId: category.id,
      description:
        "Le Rossignol Arcade 84 Open 2026 est un ski all-mountain polyvalent pensé pour les skieurs intermédiaires à confirmés qui veulent conserver de la précision sur piste tout en gardant de l’aisance dans les neiges plus variables. Sa largeur au patin permet d’alterner carving, bords de piste et passages en neige souple avec un bon équilibre entre accroche, stabilité et maniabilité.",
      attributes: {
        pratique: "All-mountain",
        niveau: "Intermédiaire à confirmé",
        largeurPatin: "84 mm",
        programme: "Piste / bords de piste",
      },
    },
  });

  const sku = await prisma.sku.upsert({
    where: { gtin: "TEST-ROSSIGNOL-ARCADE-84-176" },
    update: {
      productId: product.id,
      variant: "176 cm",
      attributes: {
        taille: "176 cm",
      },
    },
    create: {
      productId: product.id,
      variant: "176 cm",
      gtin: "TEST-ROSSIGNOL-ARCADE-84-176",
      attributes: {
        taille: "176 cm",
      },
    },
  });

  const merchants = await Promise.all([
    prisma.merchant.upsert({
      where: { slug: "ekosport" },
      update: {},
      create: {
        name: "Ekosport",
        slug: "ekosport",
        network: "kwanko",
        programId: "test-ekosport",
        status: "active",
      },
    }),
    prisma.merchant.upsert({
      where: { slug: "snowleader" },
      update: {},
      create: {
        name: "Snowleader",
        slug: "snowleader",
        network: "awin",
        programId: "test-snowleader",
        status: "active",
      },
    }),
    prisma.merchant.upsert({
      where: { slug: "glisshop" },
      update: {},
      create: {
        name: "Glisshop",
        slug: "glisshop",
        network: "direct",
        programId: "test-glisshop",
        status: "active",
      },
    }),
  ]);

  const offers = [
    {
      merchant: merchants[0],
      priceCents: 57990,
      shippingCents: 0,
      affiliateUrl: "https://example.com/ekosport/rossignol-arcade-84-open-2026",
    },
    {
      merchant: merchants[1],
      priceCents: 59990,
      shippingCents: 990,
      affiliateUrl: "https://example.com/snowleader/rossignol-arcade-84-open-2026",
    },
    {
      merchant: merchants[2],
      priceCents: 56990,
      shippingCents: 1490,
      affiliateUrl: "https://example.com/glisshop/rossignol-arcade-84-open-2026",
    },
  ];

  for (const offer of offers) {
    await prisma.offer.upsert({
      where: {
        skuId_merchantId: {
          skuId: sku.id,
          merchantId: offer.merchant.id,
        },
      },
      update: {
        affiliateUrl: offer.affiliateUrl,
        priceCents: offer.priceCents,
        shippingCents: offer.shippingCents,
        currency: "EUR",
        inStock: true,
        lastSeen: new Date(),
      },
      create: {
        skuId: sku.id,
        merchantId: offer.merchant.id,
        affiliateUrl: offer.affiliateUrl,
        priceCents: offer.priceCents,
        shippingCents: offer.shippingCents,
        currency: "EUR",
        inStock: true,
        lastSeen: new Date(),
      },
    });
  }

  console.log("Produit test créé :", {
    product: productTitle,
    slug: productSlug,
    brand: brand.slug,
    category: category.slug,
    productUrl: `/p/${productSlug}`,
    brandUrl: `/marques/${brand.slug}`,
    categoryUrl: `/${category.slug}`,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });