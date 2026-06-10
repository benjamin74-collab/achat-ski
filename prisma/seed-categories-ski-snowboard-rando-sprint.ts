import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

type CategorySeed = {
  slug: string;
  name: string;
  parentSlug: string | null;
  order: number;
  isInMenu: boolean;
  published: boolean;
  intro: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  mapKwanko?: string[];
  mapEkosport?: string[];
  mapSnowleader?: string[];
  mapGlisshop?: string[];
  aliases?: string[];
};

const dataPath = path.join(process.cwd(), "prisma", "data", "categories_ski_snowboard_rando_sprint.json");
const categories = JSON.parse(fs.readFileSync(dataPath, "utf-8")) as CategorySeed[];

async function main() {
  console.log(`Import de ${categories.length} catégories...`);

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      create: {
        slug: category.slug,
        name: category.name,
        intro: category.intro,
        content: category.content,
        metaTitle: category.metaTitle,
        metaDescription: category.metaDescription,
        isInMenu: category.isInMenu,
        order: category.order,
        published: category.published,
        mapKwanko: category.mapKwanko ?? [],
        mapEkosport: category.mapEkosport ?? [],
        mapSnowleader: category.mapSnowleader ?? [],
        mapGlisshop: category.mapGlisshop ?? [],
        aliases: category.aliases ?? [],
      },
      update: {
        name: category.name,
        intro: category.intro,
        content: category.content,
        metaTitle: category.metaTitle,
        metaDescription: category.metaDescription,
        isInMenu: category.isInMenu,
        order: category.order,
        published: category.published,
        mapKwanko: category.mapKwanko ?? [],
        mapEkosport: category.mapEkosport ?? [],
        mapSnowleader: category.mapSnowleader ?? [],
        mapGlisshop: category.mapGlisshop ?? [],
        aliases: category.aliases ?? [],
      },
    });
  }

  for (const category of categories) {
    let parentId: number | null = null;

    if (category.parentSlug) {
      const parent = await prisma.category.findUnique({
        where: { slug: category.parentSlug },
        select: { id: true },
      });

      if (!parent) {
        throw new Error(`Parent introuvable pour ${category.slug}: ${category.parentSlug}`);
      }

      parentId = parent.id;
    }

    await prisma.category.update({
      where: { slug: category.slug },
      data: { parentId },
    });
  }

  console.log("Import terminé avec succès.");
}

main()
  .catch((error) => {
    console.error("Erreur pendant l'import des catégories :", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
