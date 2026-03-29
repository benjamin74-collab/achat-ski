import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

type ImportCategory = {
  slug: string;
  name: string;
  parentSlug: string | null;
  level?: number;
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
  const filePath = path.join(process.cwd(), "prisma", "data", "categories_ski_nordique.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  const categories = JSON.parse(raw) as ImportCategory[];

  // 1) Upsert first pass without parentId
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        intro: cat.intro ?? null,
        content: cat.content ?? null,
        metaTitle: cat.metaTitle ?? null,
        metaDescription: cat.metaDescription ?? null,
        isInMenu: cat.isInMenu ?? true,
        order: cat.order ?? 0,
        published: cat.published ?? true,
        aliases: cat.aliases ?? [],
        mapKwanko: cat.mapKwanko ?? [],
        mapEkosport: cat.mapEkosport ?? [],
        mapSnowleader: cat.mapSnowleader ?? [],
        mapGlisshop: cat.mapGlisshop ?? [],
      },
      create: {
        slug: cat.slug,
        name: cat.name,
        intro: cat.intro ?? null,
        content: cat.content ?? null,
        metaTitle: cat.metaTitle ?? null,
        metaDescription: cat.metaDescription ?? null,
        isInMenu: cat.isInMenu ?? true,
        order: cat.order ?? 0,
        published: cat.published ?? true,
        aliases: cat.aliases ?? [],
        mapKwanko: cat.mapKwanko ?? [],
        mapEkosport: cat.mapEkosport ?? [],
        mapSnowleader: cat.mapSnowleader ?? [],
        mapGlisshop: cat.mapGlisshop ?? [],
      },
    });
  }

  // 2) Resolve parent relationships
  for (const cat of categories) {
    if (!cat.parentSlug) continue;

    const parent = await prisma.category.findUnique({
      where: { slug: cat.parentSlug },
      select: { id: true },
    });

    if (!parent) {
      throw new Error(`Parent slug not found: ${cat.parentSlug} for ${cat.slug}`);
    }

    await prisma.category.update({
      where: { slug: cat.slug },
      data: { parentId: parent.id },
    });
  }

  console.log(`Imported ${categories.length} nordic categories.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });