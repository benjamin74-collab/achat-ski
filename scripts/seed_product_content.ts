// scripts/seed_product_content.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const slug = process.env.SEED_PRODUCT_SLUG || "salomon-qst-98-2024"; // adapte au besoin
  const p = await prisma.product.findUnique({ where: { slug } });
  if (!p) {
    console.error(`Produit introuvable: ${slug}`);
    process.exit(1);
  }

  await prisma.product.update({
    where: { id: p.id },
    data: {
      description:
        "Ski polyvalent Freeride/All-Mountain conçu pour enchaîner les terrains variés. Construction stable, patin ~98 mm, accessible mais performant.",
    },
  });

  // Quelques avis
  await prisma.review.createMany({
    data: [
      {
        productId: p.id,
        rating: 5,
        title: "Super accroche sur neige dure",
        body: "Très bon maintien, passe partout. Bluffé par la stabilité en vitesse.",
        authorName: "Pierre",
        sourceName: "Achat-Ski",
      },
      {
        productId: p.id,
        rating: 4,
        title: "Polyvalent",
        body: "Bon compromis piste/bords de piste. Un poil physique en fin de journée.",
        authorName: "Claire",
        sourceName: "Achat-Ski",
      },
    ],
  });

  // Un test éditorial
  await prisma.editorialTest.create({
    data: {
      productId: p.id,
      title: "Test terrain — QST 98",
      excerpt:
        "Un ski cohérent pour varier les plaisirs : ludique en trafolle, sain sur piste. Meilleure plage d’usage pour skieurs intermédiaires à experts.",
      score: 8.5,
      sourceName: "Skipass (exemple)",
      sourceUrl: "https://example.com/test-qst-98",
      publishedAt: new Date(),
    },
  });

  console.log("✅ Contenu produit seedé avec succès.");
}

main().finally(() => prisma.$disconnect());
