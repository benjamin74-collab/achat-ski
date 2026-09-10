import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { normalizeBrand } from "../src/lib/brand-normalization";

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
  const normalizedBrand = normalizeBrand(
    brand.name
  );

  const canonicalName =
    normalizedBrand?.name ?? brand.name;

  const canonicalSlug =
    normalizedBrand?.slug ?? brand.slug;

  await prisma.brand.upsert({
    where: {
      slug: canonicalSlug,
    },

    update: {
	  name: canonicalName,

	  ...(brand.websiteUrl?.trim()
		? { websiteUrl: brand.websiteUrl }
		: {}),

	  ...(brand.metaTitle?.trim()
		? { metaTitle: brand.metaTitle }
		: {}),

	  ...(brand.metaDescription?.trim()
		? {
			metaDescription:
			  brand.metaDescription,
		  }
		: {}),

	  ...(brand.description?.trim()
		? { description: brand.description }
		: {}),

	  active: true,
	},

    create: {
      name: canonicalName,
      slug: canonicalSlug,
      websiteUrl: brand.websiteUrl,
      metaTitle: brand.metaTitle,
      metaDescription: brand.metaDescription,
      description: brand.description,
      active: true,
      showOnHomepage: false,
    },
  });

  console.log(
    `✅ Marque importée/mise à jour : ${brand.name}` +
      (canonicalName !== brand.name
        ? ` → ${canonicalName}`
        : "")
	  );
	}
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