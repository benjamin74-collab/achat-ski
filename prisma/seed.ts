// prisma/seed.ts
import { MerchantNetwork, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  /**
   * Seed minimal :
   * - aucun produit de démonstration ;
   * - aucun SKU de démonstration ;
   * - aucune offre de démonstration ;
   * - aucun avis ;
   * - aucun test éditorial.
   *
   * On conserve uniquement les marchands connus afin que les imports
   * puissent les retrouver par leur slug.
   */

  await prisma.merchant.upsert({
    where: {
      slug: "ekosport",
    },
    update: {
      name: "Ekosport",
      platform: MerchantNetwork.KWANKO,
      network: "kwanko",
      status: "active",
      active: true,
    },
    create: {
      name: "Ekosport",
      slug: "ekosport",
      platform: MerchantNetwork.KWANKO,
      network: "kwanko",
      status: "active",
      active: true,
    },
  });

  await prisma.merchant.upsert({
    where: {
      slug: "snowleader",
    },
    update: {
      name: "Snowleader",
      platform: MerchantNetwork.AFFILAE,
      network: "affilae",
      status: "active",
      active: true,
    },
    create: {
      name: "Snowleader",
      slug: "snowleader",
      platform: MerchantNetwork.AFFILAE,
      network: "affilae",
      status: "active",
      active: true,
    },
  });

  await prisma.merchant.upsert({
    where: {
      slug: "glisshop",
    },
    update: {
      name: "Glisshop",
      platform: MerchantNetwork.OTHER,
      status: "active",
      active: true,
    },
    create: {
      name: "Glisshop",
      slug: "glisshop",
      platform: MerchantNetwork.OTHER,
      status: "active",
      active: true,
    },
  });

  console.log("Seed terminé : marchands initialisés.");
}

main()
  .catch((error) => {
    console.error("Erreur pendant le seed Prisma :", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });