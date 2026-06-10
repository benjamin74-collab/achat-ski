import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

type MenuCategorySeed = {
  slug: string;
  name: string;
  parentSlug: string | null;
  order: number;
  isInMenu: boolean;
  published: boolean;
  createIfMissing?: boolean;
  intro?: string;
  content?: string;
  metaTitle?: string;
  metaDescription?: string;
  mapKwanko?: string[];
  mapEkosport?: string[];
  mapSnowleader?: string[];
  mapGlisshop?: string[];
  aliases?: string[];
};

const dataPath = path.join(process.cwd(), "prisma", "data", "categories_menu_structure_meilleur_ski.json");
const categories = JSON.parse(fs.readFileSync(dataPath, "utf-8")) as MenuCategorySeed[];

async function main() {
  console.log(`Mise à jour structure menu : ${categories.length} catégories`);

  // 1) Crée uniquement les catégories manquantes marquées createIfMissing.
  for (const category of categories) {
    const existing = await prisma.category.findUnique({ where: { slug: category.slug }, select: { id: true } });

    if (!existing) {
      if (!category.createIfMissing) {
        throw new Error(`Catégorie introuvable et non marquée createIfMissing : ${category.slug}`);
      }

      await prisma.category.create({
        data: {
          slug: category.slug,
          name: category.name,
          intro: category.intro ?? "",
          content: category.content ?? "",
          metaTitle: category.metaTitle ?? category.name,
          metaDescription: category.metaDescription ?? "",
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
  }

  // 2) Met à jour parent, ordre, visibilité menu, publication et nom.
  //    Le contenu SEO existant est conservé pour les catégories déjà présentes.
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
      data: {
        name: category.name,
        parentId,
        order: category.order,
        isInMenu: category.isInMenu,
        published: category.published,
      },
    });
  }

  console.log("Structure menu catégories mise à jour avec succès.");
}

main()
  .catch((error) => {
    console.error("Erreur import structure menu catégories :", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
