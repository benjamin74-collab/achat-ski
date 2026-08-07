import { PageKind, PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

type GuideCategorySeed = {
  slug: string;
  name: string;
  description?: string | null;
  order?: number;
  isInMenu?: boolean;
  active?: boolean;
};

type PageSeed = {
  slug: string;
  title: string;
  intro?: string | null;
  content: string;
  kind?: "GUIDE" | "COMPARATIF" | "ARTICLE";
  published?: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  tags?: string[];
  guideCategorySlug?: string | null;
  categorySlug?: string | null;
};

type SeedFile = {
  guideCategory: GuideCategorySeed;
  pages: PageSeed[];
};

async function main() {
  const inputPath = process.argv[2];

  if (!inputPath) {
    throw new Error(
      "Fichier JSON manquant. Exemple : npm run seed:pages -- prisma/seed-data/pages_guides_meilleur_robot_prisma.json"
    );
  }

  const filePath = path.isAbsolute(inputPath)
    ? inputPath
    : path.join(process.cwd(), inputPath);

  if (!fs.existsSync(filePath)) {
    throw new Error("Fichier introuvable : " + filePath);
  }

  const seed: SeedFile = JSON.parse(fs.readFileSync(filePath, "utf8"));

  if (!seed.guideCategory || !Array.isArray(seed.pages)) {
    throw new Error(
      "Le fichier JSON doit contenir guideCategory et pages."
    );
  }

  const guideCategory = await prisma.guideCategory.upsert({
    where: {
      slug: seed.guideCategory.slug,
    },
    update: {
      name: seed.guideCategory.name,
      description: seed.guideCategory.description ?? null,
      order: seed.guideCategory.order ?? 0,
      isInMenu: seed.guideCategory.isInMenu ?? false,
      active: seed.guideCategory.active ?? true,
    },
    create: {
      slug: seed.guideCategory.slug,
      name: seed.guideCategory.name,
      description: seed.guideCategory.description ?? null,
      order: seed.guideCategory.order ?? 0,
      isInMenu: seed.guideCategory.isInMenu ?? false,
      active: seed.guideCategory.active ?? true,
    },
  });

  console.log(
    "GuideCategory importee/mise a jour : " + guideCategory.name
  );

  for (const page of seed.pages) {
    if (!page.slug || !page.title || !page.content) {
      throw new Error(
        "Page invalide : slug, title ou content manquant : " +
          JSON.stringify(page)
      );
    }

    let categoryId: number | null = null;

    if (page.categorySlug) {
      const category = await prisma.category.findUnique({
        where: {
          slug: page.categorySlug,
        },
        select: {
          id: true,
        },
      });

      if (!category) {
        throw new Error(
          "Categorie introuvable pour la page " +
            page.slug +
            " : " +
            page.categorySlug
        );
      }

      categoryId = category.id;
    }

    const kind =
      page.kind === "COMPARATIF"
        ? PageKind.COMPARATIF
        : page.kind === "ARTICLE"
        ? PageKind.ARTICLE
        : PageKind.GUIDE;

    await prisma.page.upsert({
      where: {
        slug: page.slug,
      },
      update: {
        title: page.title,
        intro: page.intro ?? null,
        content: page.content,
        kind,
        published: page.published ?? true,
        metaTitle: page.metaTitle ?? null,
        metaDescription: page.metaDescription ?? null,
        tags: page.tags ?? [],
        guideCategoryId: guideCategory.id,
        categoryId,
      },
      create: {
        slug: page.slug,
        title: page.title,
        intro: page.intro ?? null,
        content: page.content,
        kind,
        published: page.published ?? true,
        metaTitle: page.metaTitle ?? null,
        metaDescription: page.metaDescription ?? null,
        tags: page.tags ?? [],
        guideCategoryId: guideCategory.id,
        categoryId,
      },
    });

    console.log(
      "Page importee/mise a jour : " +
        page.title +
        " (" +
        page.slug +
        ")"
    );
  }

  console.log("");
  console.log("Import termine : " + seed.pages.length + " pages.");
  console.log("Fichier : " + filePath);
}

main()
  .catch((e) => {
    console.error("Erreur import pages :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
