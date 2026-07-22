import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type MappingDefinition = {
  source: string;
  targetCandidates: string[];
  comment?: string;
};

const mappings: MappingDefinition[] = [
  /*
   * SKI ALPIN
   */

  {
    source:
      "Ekosport > Nos Univers > Ski alpin > Matériel ski > Ski",
    targetCandidates: ["skis"],
  },
  {
    source:
      "Ekosport > Nos Univers > Ski alpin > Matériel ski > Pack ski",
    targetCandidates: ["packs-skis", "skis"],
    comment:
      "Le flux ne précise pas piste, freeride ou all-mountain.",
  },
  {
    source:
      "Ekosport > Nos Univers > Ski alpin > Matériel ski > Chaussure de ski",
    targetCandidates: [
      "chaussure-de-ski",
      "chaussures-ski",
    ],
  },
  {
    source:
      "Ekosport > Nos Univers > Ski alpin > Matériel ski > Fixation ski",
    targetCandidates: [
      "fixations-ski",
      "fixations-ski-alpin",
      "skis",
    ],
  },

  /*
   * ÉQUIPEMENT SKI ALPIN
   *
   * Ces catégories ne seront ajoutées que si le slug existe.
   */

  {
    source:
      "Ekosport > Nos Univers > Ski alpin > Equipement ski > Casque de ski",
    targetCandidates: [
      "casques-ski",
      "casque-ski",
      "casques",
    ],
  },
  {
    source:
      "Ekosport > Nos Univers > Ski alpin > Equipement ski > Masque de ski",
    targetCandidates: [
      "masques-ski",
      "masque-ski",
      "masques",
    ],
  },

  /*
   * VÊTEMENTS SKI ALPIN
   */

  {
    source:
      "Ekosport > Nos Univers > Ski alpin > Vêtement de ski > Après ski",
    targetCandidates: [
      "apres-ski",
      "chaussures-apres-ski",
    ],
  },
  {
    source:
      "Ekosport > Nos Univers > Ski alpin > Vêtement de ski > Doudoune ski",
    targetCandidates: [
      "doudounes-ski",
      "vestes-ski",
      "vetements-ski",
    ],
  },
  {
    source:
      "Ekosport > Nos Univers > Ski alpin > Vêtement de ski > Gant de ski",
    targetCandidates: [
      "gants-ski",
      "gants",
      "vetements-ski",
    ],
  },
  {
    source:
      "Ekosport > Nos Univers > Ski alpin > Vêtement de ski > Moufle ski",
    targetCandidates: [
      "moufles-ski",
      "gants-ski",
      "vetements-ski",
    ],
  },
  {
    source:
      "Ekosport > Nos Univers > Ski alpin > Vêtement de ski > Pantalon de ski",
    targetCandidates: [
      "pantalons-ski",
      "vetements-ski",
    ],
  },
  {
    source:
      "Ekosport > Nos Univers > Ski alpin > Vêtement de ski > Polaire > Veste polaire",
    targetCandidates: [
      "polaires-ski",
      "vestes-polaires",
      "vetements-ski",
    ],
  },
  {
    source:
      "Ekosport > Nos Univers > Ski alpin > Vêtement de ski > Veste de ski",
    targetCandidates: [
      "vestes-ski",
      "vetements-ski",
    ],
  },

  /*
   * SKI DE FOND
   *
   * Les chemins Ekosport ne permettent pas de distinguer skating
   * et classique. On les place donc dans le hub ski-nordique.
   *
   * Une classification plus fine pourra ensuite analyser le nom,
   * la description et les attributs des produits.
   */

  {
    source:
      "Ekosport > Nos Univers > Ski de fond > Matériel ski de fond > Ski de fond",
    targetCandidates: ["ski-nordique"],
  },
  {
    source:
      "Ekosport > Nos Univers > Ski de fond > Matériel ski de fond > Pack ski de fond",
    targetCandidates: ["ski-nordique"],
  },
  {
    source:
      "Ekosport > Nos Univers > Ski de fond > Matériel ski de fond > Chaussure ski de fond",
    targetCandidates: ["ski-nordique"],
  },
  {
    source:
      "Ekosport > Nos Univers > Ski de fond > Matériel ski de fond > Fixation ski de fond",
    targetCandidates: ["ski-nordique"],
  },
  {
    source:
      "Ekosport > Nos Univers > Ski de fond > Matériel ski de fond > Bâton ski de fond",
    targetCandidates: ["ski-nordique"],
  },
  {
    source:
      "Ekosport > Nos Univers > Ski de fond > Vêtement ski de fond > Veste ski de fond",
    targetCandidates: [
      "vetements-ski-nordique",
      "vestes-ski-nordique",
      "ski-nordique",
    ],
  },

  /*
   * SKI DE RANDONNÉE
   */

  {
    source:
      "Ekosport > Nos Univers > Ski de randonnée > Matériel ski de randonnée > Ski de randonnée",
    targetCandidates: [
      "skis-randonnee",
      "ski-randonnee",
      "skis",
    ],
  },
  {
    source:
      "Ekosport > Nos Univers > Ski de randonnée > Matériel ski de randonnée > Pack ski de randonnée",
    targetCandidates: [
      "packs-skis-randonnee",
      "packs-ski-randonnee",
      "ski-randonnee",
      "skis",
    ],
  },
  {
    source:
      "Ekosport > Nos Univers > Ski de randonnée > Matériel ski de randonnée > Chaussure ski de randonnée",
    targetCandidates: [
      "chaussures-ski-randonnee",
      "chaussure-ski-randonnee",
      "ski-randonnee",
      "chaussure-de-ski",
    ],
  },
  {
    source:
      "Ekosport > Nos Univers > Ski de randonnée > Matériel ski de randonnée > Fixation ski de randonnée",
    targetCandidates: [
      "fixations-ski-randonnee",
      "fixation-ski-randonnee",
      "ski-randonnee",
      "fixations-ski",
    ],
  },
  {
    source:
      "Ekosport > Nos Univers > Ski de randonnée > Matériel ski de randonnée > Bâton ski de randonnée",
    targetCandidates: [
      "batons-ski-randonnee",
      "baton-ski-randonnee",
      "ski-randonnee",
    ],
  },
  {
    source:
      "Ekosport > Nos Univers > Ski de randonnée > Accessoire ski de randonnée > Peau de phoque",
    targetCandidates: [
      "peaux-phoque",
      "peaux-de-phoque",
      "accessoires-ski-randonnee",
      "ski-randonnee",
    ],
  },
  {
    source:
      "Ekosport > Nos Univers > Ski de randonnée > Vêtement ski de randonnée > Veste softshell",
    targetCandidates: [
      "vestes-ski-randonnee",
      "vetements-ski-randonnee",
      "ski-randonnee",
    ],
  },

  /*
   * SNOWBOARD
   *
   * Le chemin ne distingue pas freestyle, freeride ou all-mountain.
   */

  {
    source:
      "Ekosport > Nos Univers > Snowboard > Matériel snowboard > Planche de snowboard",
    targetCandidates: [
      "planches-snowboard",
      "snowboards",
      "snowboard",
    ],
  },
  {
    source:
      "Ekosport > Nos Univers > Snowboard > Matériel snowboard > Pack snowboard",
    targetCandidates: [
      "packs-snowboard",
      "snowboard",
    ],
  },
  {
    source:
      "Ekosport > Nos Univers > Snowboard > Matériel snowboard > Boots snowboard",
    targetCandidates: [
      "boots-snowboard",
      "chaussures-snowboard",
      "snowboard",
    ],
  },
  {
    source:
      "Ekosport > Nos Univers > Snowboard > Matériel snowboard > Fixation snowboard",
    targetCandidates: [
      "fixations-snowboard",
      "snowboard",
    ],
  },
  {
    source:
      "Ekosport > Nos Univers > Snowboard > Equipement snowboard > Protection snowboard > Dorsale snowboard",
    targetCandidates: [
      "protections-snowboard",
      "dorsales-snowboard",
      "snowboard",
    ],
  },
  {
    source:
      "Ekosport > Nos Univers > Snowboard > Vêtement snowboard > Veste snowboard",
    targetCandidates: [
      "vestes-snowboard",
      "vetements-snowboard",
      "snowboard",
    ],
  },
];

async function main() {
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      mapEkosport: true,
    },
  });

  const categoriesBySlug = new Map(
    categories.map((category) => [
      category.slug,
      category,
    ])
  );

  let updatedCategories = 0;
  let addedMappings = 0;
  let unchangedMappings = 0;
  let skippedMappings = 0;

  console.log("");
  console.log("========================================");
  console.log("MAPPINGS EKOSPORT");
  console.log("========================================");
  console.log("");

  for (const mapping of mappings) {
    const target = mapping.targetCandidates
      .map((slug) => categoriesBySlug.get(slug))
      .find(
        (
          category
        ): category is NonNullable<typeof category> =>
          Boolean(category)
      );

    if (!target) {
      skippedMappings += 1;

      console.log("IGNORÉ");
      console.log(`  Source : ${mapping.source}`);
      console.log(
        `  Slugs recherchés : ${mapping.targetCandidates.join(
          ", "
        )}`
      );

      if (mapping.comment) {
        console.log(`  Note : ${mapping.comment}`);
      }

      console.log("");
      continue;
    }

    const currentMappings = target.mapEkosport ?? [];

    if (currentMappings.includes(mapping.source)) {
      unchangedMappings += 1;

      console.log("DÉJÀ PRÉSENT");
      console.log(`  Source : ${mapping.source}`);
      console.log(
        `  Cible  : ${target.name} (${target.slug})`
      );
      console.log("");

      continue;
    }

    await prisma.category.update({
      where: {
        id: target.id,
      },
      data: {
        mapEkosport: {
          push: mapping.source,
        },
      },
    });

    /*
     * On met aussi à jour la copie mémoire pour éviter de perdre
     * un mapping lorsqu'une même catégorie reçoit plusieurs chemins
     * pendant cette exécution.
     */
    target.mapEkosport = [
      ...currentMappings,
      mapping.source,
    ];

    updatedCategories += 1;
    addedMappings += 1;

    console.log("AJOUTÉ");
    console.log(`  Source : ${mapping.source}`);
    console.log(
      `  Cible  : ${target.name} (${target.slug})`
    );

    if (mapping.comment) {
      console.log(`  Note : ${mapping.comment}`);
    }

    console.log("");
  }

  console.log("========================================");
  console.log("RÉSUMÉ");
  console.log("========================================");
  console.log({
    definitions: mappings.length,
    addedMappings,
    unchangedMappings,
    skippedMappings,
    updatedCategories,
  });
}

main()
  .catch((error) => {
    console.error(
      "Erreur pendant l'enregistrement des mappings Ekosport"
    );
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });