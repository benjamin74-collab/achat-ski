import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { parseCsv } from "../src/lib/catalog/csv";
import { normalizeEkosportFeed } from "../src/lib/catalog/import-ekosport";
import { importNormalizedFeedItem } from "../src/lib/catalog/import-service";
import { validateFeedItem } from "../src/lib/catalog/validate";

const prisma = new PrismaClient();

async function main() {
  const filePath = process.argv[2];

  if (!filePath) {
    throw new Error(
      "Chemin du fichier manquant. Exemple : npm run feed:import:ekosport -- prisma/feed-data/ekosport.csv"
    );
  }

  const absolutePath = resolve(process.cwd(), filePath);
  const content = readFileSync(absolutePath, "utf-8");

  const rows = parseCsv(content, {
    delimiter: "|",
  });

  const items = normalizeEkosportFeed(rows);

  const merchant = await prisma.merchant.upsert({
    where: { slug: "ekosport" },
    update: {
      name: "Ekosport",
      network: "kwanko",
      platform: "KWANKO",
      status: "active",
      active: true,
    },
    create: {
      name: "Ekosport",
      slug: "ekosport",
      network: "kwanko",
      platform: "KWANKO",
      status: "active",
      active: true,
    },
  });

  const feedImport = await prisma.feedImport.create({
    data: {
      merchantId: merchant.id,
      platform: "kwanko",
      filename: filePath,
      status: "running",
      totalRows: rows.length,
    },
  });

  const stats = {
    createdProducts: 0,
    updatedProducts: 0,
    createdSkus: 0,
    updatedSkus: 0,
    createdOffers: 0,
    updatedOffers: 0,
  };

  let importedRows = 0;
  let errorsCount = 0;

  for (const item of items) {
    const validation = validateFeedItem(item);

    const rawFeedProduct = await prisma.rawFeedProduct.create({
      data: {
        feedImportId: feedImport.id,
        merchantId: merchant.id,
        externalId: item.externalId,
        parentExternalId: item.parentExternalId,
        ean: item.ean,
        manufacturerRef: item.manufacturerReference,
        title: item.title,
        brand: item.brand,
        rawData: item.rawData,
        processed: false,
      },
    });

    if (!validation.valid) {
      errorsCount += 1;

      await prisma.rawFeedProduct.update({
        where: { id: rawFeedProduct.id },
        data: {
          error: validation.errors.join(" | "),
          processed: true,
        },
      });

      continue;
    }

    try {
      const result = await importNormalizedFeedItem(prisma, item, stats);

      await prisma.rawFeedProduct.update({
        where: { id: rawFeedProduct.id },
        data: {
          processed: true,
          matchedProductId: result.product.id,
          matchedSkuId: result.sku.id,
          matchedOfferId: result.offer.id,
        },
      });

      importedRows += 1;
    } catch (error) {
      errorsCount += 1;

      await prisma.rawFeedProduct.update({
        where: { id: rawFeedProduct.id },
        data: {
          processed: true,
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  await prisma.feedImport.update({
    where: { id: feedImport.id },
    data: {
      status: errorsCount > 0 ? "success_with_errors" : "success",
      importedRows,
      errorsCount,
      createdProducts: stats.createdProducts,
      updatedProducts: stats.updatedProducts,
      createdSkus: stats.createdSkus,
      updatedSkus: stats.updatedSkus,
      createdOffers: stats.createdOffers,
      updatedOffers: stats.updatedOffers,
      finishedAt: new Date(),
    },
  });

  console.log("Import Ekosport terminé");
  console.log({
    totalRows: rows.length,
    importedRows,
    errorsCount,
    ...stats,
  });
}

main()
  .catch((error) => {
    console.error("Erreur import Ekosport");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });