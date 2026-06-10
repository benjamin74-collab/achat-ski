import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  const inputPath = process.argv[2];

  if (!inputPath) {
    throw new Error(
      "Fichier JSON manquant. Exemple : npm run seed:brands -- prisma/seed-data/brands-lot-2.json"
    );
  }

  const filePath = path.isAbsolute(inputPath)
    ? inputPath
    : path.join(process.cwd(), inputPath);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Fichier introuvable : ${filePath}`);
  }

  const brands = JSON.parse(fs.readFileSync(filePath, "utf8"));

  for (const brand of brands) {
    await prisma.brand.upsert({
      where: { slug: brand.slug },
      update: {
        name: brand.name,
        websiteUrl: brand.websiteUrl,
        metaTitle: brand.metaTitle,
        metaDescription: brand.metaDescription,
        description: brand.description,
        active: true,
      },
      create: {
        name: brand.name,
        slug: brand.slug,
        websiteUrl: brand.websiteUrl,
        metaTitle: brand.metaTitle,
        metaDescription: brand.metaDescription,
        description: brand.description,
        active: true,
        showOnHomepage: false,
      },
    });

    console.log(`✅ Marque importée/mise à jour : ${brand.name}`);
  }

  console.log(`\nImport terminé : ${brands.length} marques depuis ${filePath}`);
}

main()
  .catch((e) => {
    console.error("❌ Erreur import marques :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });