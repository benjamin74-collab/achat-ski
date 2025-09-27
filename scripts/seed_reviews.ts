// scripts/seed_reviews.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function run() {
  const products = await prisma.product.findMany({
    select: { id: true, brand: true, model: true, season: true, category: true, description: true, slug: true },
    orderBy: { id: "asc" },
  });

  if (products.length === 0) {
    console.log("Aucun produit trouvé. Lance d'abord l'ingestion (KWANKO_FEED_URLS + npm run ingest:kwanko).");
    return;
  }

  let updated = 0, reviewsCreated = 0, testsCreated = 0;

  for (const p of products) {
    const name = [p.brand, p.model, p.season].filter(Boolean).join(" ");
    // 1) Description (si manquante)
    if (!p.description || p.description.trim() === "") {
      await prisma.product.update({
        where: { id: p.id },
        data: {
          description:
            `Présentation de ${name}.\n\n` +
            `Catégorie: ${p.category ?? "—"}.\n` +
            `Ce texte est un placeholder éditorial (seed) afin de tester la page produit : ` +
            `caractère, programme, terrain et public visé. A remplacer par du vrai contenu ultérieurement.`,
        },
      });
      updated++;
    }

    // 2) Avis utilisateurs (si moins de 2)
    const reviewCount = await prisma.review.count({ where: { productId: p.id } });
    if (reviewCount < 2) {
      await prisma.review.createMany({
        data: [
          {
            productId: p.id,
            rating: 5,
            title: `Excellent ${p.model ?? "modèle"}`,
            body: `Très stable et polyvalent. Très bon comportement sur la neige dure comme en trafolle. (seed)`,
            authorName: "Utilisateur vérifié",
            sourceName: "Achat-Ski",
            sourceUrl: `https://achat-ski.vercel.app/p/${p.slug}`,
          },
          {
            productId: p.id,
            rating: 4,
            title: "Très bon rapport qualité/prix",
            body: `Ski joueur, maniable, tient bien le rythme. Un peu physique en très grande vitesse. (seed)`,
            authorName: "Anonyme",
            sourceName: "Achat-Ski",
            sourceUrl: `https://achat-ski.vercel.app/p/${p.slug}`,
          },
        ],
        skipDuplicates: true,
      });
      reviewsCreated += 2;
    }

    // 3) Test éditorial (si aucun)
    const testCount = await prisma.editorialTest.count({ where: { productId: p.id } });
    if (testCount === 0) {
      await prisma.editorialTest.create({
        data: {
          productId: p.id,
          title: `Test terrain — ${name}`,
          excerpt:
            `Résumé du test (seed) : Accroche sur piste, bonne tenue en courbe, tolérance correcte. ` +
            `En hors-piste, portance satisfaisante pour la largeur. Idéal skieur intermédiaire/confirmé.`,
          score: 8.5,
          sourceName: "Rédaction Achat-Ski",
          sourceUrl: `https://achat-ski.vercel.app/p/${p.slug}`,
        },
      });
      testsCreated += 1;
    }
  }

  console.log(`Descriptions ajoutées: ${updated}`);
  console.log(`Avis créés: ${reviewsCreated}`);
  console.log(`Tests éditoriaux créés: ${testsCreated}`);
}

run()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
