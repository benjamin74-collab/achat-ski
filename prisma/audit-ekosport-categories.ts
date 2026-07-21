import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { parseCsv } from "../src/lib/catalog/csv";
import {
  loadEkosportCategoryMappings,
  resolveEkosportCategories,
} from "../src/lib/catalog/category-mapping";
import type { MappedCategory } from "../src/lib/catalog/feed-types";

const prisma = new PrismaClient();

const ALLOWED_UNIVERSES = [
  "Ekosport > Nos Univers > Ski alpin >",
  "Ekosport > Nos Univers > Ski de randonnée >",
  "Ekosport > Nos Univers > Ski de fond >",
  "Ekosport > Nos Univers > Snowboard >",
];

async function main() {
  const filePath =
    process.argv[2] ??
    "prisma/feed-data/liste-categorie.csv";

  const absolutePath = resolve(process.cwd(), filePath);

  const content = readFileSync(absolutePath, "latin1");

  const rows = parseCsv(content, {
    delimiter: ";",
  });

  const rawCategories = rows
    .map((row) => {
      const value =
        row["product category"] ??
        row["category"] ??
        Object.values(row)[0];

      return typeof value === "string"
        ? value.trim()
        : "";
    })
    .filter(Boolean);

  const counts = new Map<string, number>();

  for (const category of rawCategories) {
    counts.set(
      category,
      (counts.get(category) ?? 0) + 1
    );
  }

  const categorySource =
    await loadEkosportCategoryMappings(prisma);

  const categories = await prisma.category.findMany({
    where: {
      published: true,
    },
    select: {
      id: true,
      slug: true,
      name: true,
      mapEkosport: true,
    },
    orderBy: [
      { parentId: "asc" },
      { order: "asc" },
      { name: "asc" },
    ],
  });

  const allowedCategories = Array.from(
    counts.entries()
  )
    .filter(([category]) =>
      ALLOWED_UNIVERSES.some((prefix) =>
        category.startsWith(prefix)
      )
    )
    .sort(([a], [b]) => a.localeCompare(b, "fr"));

  const ignoredCategories = Array.from(
    counts.entries()
  )
    .filter(
      ([category]) =>
        !ALLOWED_UNIVERSES.some((prefix) =>
          category.startsWith(prefix)
        )
    )
    .sort(([a], [b]) => a.localeCompare(b, "fr"));

  let mappedRows = 0;
  let unmappedRows = 0;

  console.log("");
  console.log(
    "========================================"
  );
  console.log("CATÉGORIES SKI / SNOWBOARD");
  console.log(
    "========================================"
  );
  console.log("");

  for (const [
    sourceCategory,
    rowCount,
  ] of allowedCategories) {
    const result = resolveEkosportCategories(
      sourceCategory,
      categorySource
    );

    if (result) {
      mappedRows += rowCount;

      console.log(
        `OK  [${String(rowCount).padStart(
          4
        )} lignes]`
      );
      console.log(
        `    Source     : ${sourceCategory}`
      );
      console.log(
        `    Principale : ${result.primaryCategory.name} (${result.primaryCategory.slug})`
      );
      console.log(
        `    Catégories : ${result.categories
          .map(
            (category: MappedCategory) =>
              `${category.name} (${category.slug})`
          )
          .join(" > ")}`
      );
    } else {
      unmappedRows += rowCount;

      console.log(
        `NON [${String(rowCount).padStart(
          4
        )} lignes]`
      );
      console.log(
        `    Source     : ${sourceCategory}`
      );
      console.log("    Principale : aucune");
      console.log("    Catégories : aucune");
    }

    console.log("");
  }

  console.log(
    "========================================"
  );
  console.log("RÉSUMÉ");
  console.log(
    "========================================"
  );
  console.log({
    totalRows: rawCategories.length,
    uniqueCategories: counts.size,
    allowedUniqueCategories:
      allowedCategories.length,
    ignoredUniqueCategories:
      ignoredCategories.length,
    allowedRows: allowedCategories.reduce(
      (sum, [, count]) => sum + count,
      0
    ),
    ignoredRows: ignoredCategories.reduce(
      (sum, [, count]) => sum + count,
      0
    ),
    mappedRows,
    unmappedRows,
  });

  console.log("");
  console.log(
    "========================================"
  );
  console.log("CATÉGORIES LOCALES DISPONIBLES");
  console.log(
    "========================================"
  );
  console.log("");

  for (const category of categories) {
    console.log(
      `${category.slug} | ${category.name} | ${category.mapEkosport.length} mapping(s)`
    );
  }
}

main()
  .catch((error) => {
    console.error(
      "Erreur pendant l'audit des catégories Ekosport"
    );
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });