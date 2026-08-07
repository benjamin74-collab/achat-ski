import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

type CategorySeed = {
  slug: string;
  name: string;
  parentSlug?: string | null;
  intro?: string | null;
  content?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  isInMenu?: boolean;
  order?: number;
  published?: boolean;
  aliases?: string[];
  mapKwanko?: string[];
  mapEkosport?: string[];
  mapSnowleader?: string[];
  mapGlisshop?: string[];
};

async function main() {
  const inputPath = process.argv[2];

  if (!inputPath) {
    throw new Error(
      "Fichier JSON manquant. Exemple : npm run seed:categories -- prisma/seed-data/categories_meilleur_robot_prisma.json"
    );
  }

  const filePath = path.isAbsolute(inputPath)
    ? inputPath
    : path.join(process.cwd(), inputPath);

  if (!fs.existsSync(filePath)) {
    throw new Error("Fichier introuvable : " + filePath);
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const categories: CategorySeed[] = JSON.parse(raw);

  if (!Array.isArray(categories)) {
    throw new Error("Le fichier JSON doit contenir un tableau de categories.");
  }

  console.log("");
  console.log("Import de " + categories.length + " categories");
  console.log("Fichier : " + filePath);
  console.log("");

  console.log("=== PASSAGE 1 : CATEGORIES ===");
  console.log("");

  for (const category of categories) {
    if (!category.slug || !category.name) {
      throw new Error(
        "Categorie invalide : slug ou name manquant : " +
          JSON.stringify(category)
      );
    }

    await prisma.category.upsert({
      where: {
        slug: category.slug,
      },
      update: {
        name: category.name,
        intro: category.intro ?? null,
        content: category.content ?? null,
        metaTitle: category.metaTitle ?? null,
        metaDescription: category.metaDescription ?? null,
        isInMenu: category.isInMenu ?? false,
        order: category.order ?? 0,
        published: category.published ?? false,
        aliases: category.aliases ?? [],
        mapKwanko: category.mapKwanko ?? [],
        mapEkosport: category.mapEkosport ?? [],
        mapSnowleader: category.mapSnowleader ?? [],
        mapGlisshop: category.mapGlisshop ?? [],
      },
      create: {
        slug: category.slug,
        name: category.name,
        intro: category.intro ?? null,
        content: category.content ?? null,
        metaTitle: category.metaTitle ?? null,
        metaDescription: category.metaDescription ?? null,
        isInMenu: category.isInMenu ?? false,
        order: category.order ?? 0,
        published: category.published ?? false,
        aliases: category.aliases ?? [],
        mapKwanko: category.mapKwanko ?? [],
        mapEkosport: category.mapEkosport ?? [],
        mapSnowleader: category.mapSnowleader ?? [],
        mapGlisshop: category.mapGlisshop ?? [],
      },
    });

    console.log(
      "Categorie importee/mise a jour : " +
        category.name +
        " (" +
        category.slug +
        ")"
    );
  }

  console.log("");
  console.log("=== PASSAGE 2 : HIERARCHIE ===");
  console.log("");

  for (const category of categories) {
    if (!category.parentSlug) {
      await prisma.category.update({
        where: {
          slug: category.slug,
        },
        data: {
          parentId: null,
        },
      });

      console.log("Racine : " + category.name);
      continue;
    }

    const parent = await prisma.category.findUnique({
      where: {
        slug: category.parentSlug,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    if (!parent) {
      throw new Error(
        "Parent introuvable pour " +
          category.name +
          " : " +
          category.parentSlug
      );
    }

    await prisma.category.update({
      where: {
        slug: category.slug,
      },
      data: {
        parentId: parent.id,
      },
    });

    console.log(category.name + " -> " + parent.name);
  }

  console.log("");
  console.log("====================================");
  console.log("Import termine");
  console.log(categories.length + " categories traitees");
  console.log("Fichier : " + filePath);
  console.log("====================================");
  console.log("");
}

main()
  .catch((e) => {
    console.error("Erreur import categories :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
