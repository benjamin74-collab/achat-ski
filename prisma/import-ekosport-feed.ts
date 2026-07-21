import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";

import { syncEkosportCsv } from "../src/lib/catalog/sync-ekosport";

const prisma = new PrismaClient();

async function main() {
  const source = process.argv[2];
  const feedKey =
    process.argv[3] ??
    "ekosport-manual-import";

  if (!source) {
    throw new Error(
      [
        "Source manquante.",
        "Fichier local : npm run feed:import:ekosport -- prisma/feed-data/ekosport.csv ekosport-test",
        "URL : npm run feed:import:ekosport -- \"https://...\" ekosport-brands-salomon",
      ].join("\n")
    );
  }

  const isRemote = /^https?:\/\//i.test(source);

  const content = isRemote
    ? await downloadFeed(source)
    : readFileSync(
        resolve(process.cwd(), source),
        "utf-8"
      );

  const result = await syncEkosportCsv({
    prisma,
    content,
    feedKey,
    sourceUrl: isRemote ? source : undefined,
    filename: isRemote ? feedKey : basename(source),
  });

  console.log("Import Ekosport terminé");
  console.table(result);
}

async function downloadFeed(url: string): Promise<string> {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      "user-agent":
        "Meilleur-Ski Catalog Import/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Téléchargement impossible : ${response.status} ${response.statusText}`
    );
  }

  return response.text();
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
