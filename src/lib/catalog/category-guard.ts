import type {
  AggregatedFeedItem,
  MappedCategory,
} from "./feed-types";

import type {
  FeedCategoryMappings,
} from "./category-mapping";

import {
  normalizeText,
} from "./normalize";

type GuardedCategoryPlan = {
  primarySlug: string;
  allowedSlugs: string[];
  cleanupSlugs: string[];
};

const SNOWBOARD_EXCLUSIVE_SLUGS = [
  "snowboard",

  "planches-snowboard",
  "snowboard-freestyle",
  "snowboard-all-mountain",
  "snowboard-freeride",

  "packs-snowboard",

  "splitboard",

  "boots-snowboard",
  "boots-snowboard-freestyle",
  "boots-snowboard-freeride",

  "fixations-snowboard",
  "fixations-snowboard-straps",
  "fixations-snowboard-rear-entry",
  "fixations-splitboard",

  "housses-snowboard",
  "accessoires-snowboard",
];

const NORDIC_EXCLUSIVE_SLUGS = [
  "ski-nordique",
  "ski-randonnee-nordique",
  "equipement-ski-nordique",
  "batons-ski-nordique",

  "ski-skating",
  "ski-classique",
  
  "skis-skating",
  "skis-classique",

  "packs-skating",
  "packs-ski-classique",

  "chaussures-skating",
  "chaussures-classique",

  "fixations-skating",
  "fixations-classique",

  "entretien-ski-nordique",
  "fart-glisse",
  "fart-retenue",
  "outils-fartage",
];

const ALPINE_SKI_EXCLUSIVE_SLUGS = [
  "ski",

  "skis",
  "skis-piste",
  "skis-all-mountain",
  "skis-freeride",
  "skis-freestyle",
  "skis-junior",

  "packs-skis",
  "packs-skis-piste",
  "packs-skis-all-mountain",
  "packs-skis-freeride",
  "packs-skis-freestyle",
  "packs-skis-junior",

  "chaussures-ski",
  "chaussures-ski-piste",
  "chaussures-ski-freeride",
  "chaussures-ski-performance",
  "chaussures-ski-junior",

  "fixations-ski",
  "fixations-ski-piste",
  "fixations-ski-all-mountain",
  "fixations-ski-freeride",

  "batons-ski",
  "batons-ski-piste",
  "batons-ski-freeride",
  "batons-ski-junior",
];

const RANDO_EXCLUSIVE_SLUGS = [
  "ski-randonnee",

  "skis-randonnee",
  "skis-randonnee-legers",
  "skis-freerando",

  "packs-ski-randonnee",
  "packs-ski-freerando",

  "chaussures-ski-randonnee",
  "chaussures-ski-rando-legeres",
  "chaussures-freerando",

  "fixations-ski-randonnee",
  "fixations-inserts",
  "fixations-hybrides",
  "fixations-chassis",

  "peaux-phoque",
  "peaux-avec-colle",
  "peaux-sans-colle",
  "peaux-predecoupees",

  "couteaux-ski-rando",
  "freins-leash-ski-rando",
  "batons-ski-randonnee",

  "securite-avalanche",
  "dva-arva",
  "pelles-avalanche",
  "sondes-avalanche",
  "sacs-airbag",
];

/*
 * Les skis et packs de randonnée sont exclusifs des branches
 * ski alpin / packs ski alpin. Ce cleanup croisé empêche un réimport
 * de conserver ou de réintroduire ces relations contradictoires.
 */
const RANDO_SKI_CROSS_FAMILY_CLEANUP_SLUGS = [
  ...RANDO_EXCLUSIVE_SLUGS,

  "skis",
  "skis-piste",
  "skis-all-mountain",
  "skis-freeride",
  "skis-freestyle",
  "skis-junior",

  "packs-skis",
  "packs-skis-piste",
  "packs-skis-all-mountain",
  "packs-skis-freeride",
  "packs-skis-freestyle",
  "packs-skis-junior",
];

const ALPINE_SKI_CROSS_FAMILY_CLEANUP_SLUGS = [
  ...ALPINE_SKI_EXCLUSIVE_SLUGS,
  "skis-randonnee",
  "skis-randonnee-legers",
  "skis-freerando",
  "packs-ski-randonnee",
  "packs-ski-freerando",
];

/*
 * Nettoyage croise snowboard : le chemin source marchand determine la
 * nature du produit (planche, pack, splitboard, boots ou fixation).
 * Toutes les anciennes relations snowboard incompatibles sont retirees ;
 * la racine snowboard est ensuite reintroduite comme ancetre.
 */
const SNOWBOARD_BOARD_CLEANUP_SLUGS = [...SNOWBOARD_EXCLUSIVE_SLUGS];
const SNOWBOARD_PACK_CLEANUP_SLUGS = [...SNOWBOARD_EXCLUSIVE_SLUGS];
const SNOWBOARD_SPLITBOARD_CLEANUP_SLUGS = [...SNOWBOARD_EXCLUSIVE_SLUGS];
const SNOWBOARD_BOOT_CLEANUP_SLUGS = [...SNOWBOARD_EXCLUSIVE_SLUGS];
const SNOWBOARD_BINDING_CLEANUP_SLUGS = [...SNOWBOARD_EXCLUSIVE_SLUGS];



export function applyCategoryGuardToAggregatedItems(
  items: AggregatedFeedItem[],
  source: FeedCategoryMappings
): AggregatedFeedItem[] {
  return items.map((item) =>
    applyCategoryGuard(item, source)
  );
}

function applyCategoryGuard(
  aggregated: AggregatedFeedItem,
  source: FeedCategoryMappings
): AggregatedFeedItem {
const guardedPlan =
  buildSnowboardCategoryPlan(aggregated) ??
  buildNordicCategoryPlan(aggregated) ??
  buildAlpineSkiCategoryPlan(aggregated) ??
  buildRandoCategoryPlan(aggregated);

if (!guardedPlan) {
  return aggregated;
}

const primaryCategory =
  findCategoryBySlug(
    source,
    guardedPlan.primarySlug
  );

if (!primaryCategory) {
  return aggregated;
}

const categories =
  resolveCategoriesWithAncestors(
    source,
    guardedPlan.allowedSlugs
  );

const cleanupIds =
  guardedPlan.cleanupSlugs
      .map((slug) =>
        findCategoryBySlug(source, slug)?.id
      )
      .filter(
        (id): id is number =>
          typeof id === "number"
      );

  return {
    ...aggregated,
    primaryCategory,
    categories,
    categoryCleanupIds: cleanupIds,
  };
}

function buildSnowboardCategoryPlan(
  aggregated: AggregatedFeedItem
): GuardedCategoryPlan | null {
  const path = normalizeCategoryPath(
    aggregated.item.categoryPath
  );

  const currentPrimarySlug =
    aggregated.primaryCategory.slug;

  if (
    categoryPathEndsWith(path, "pack snowboard") ||
    path.includes("snowboard > packs")
  ) {
    return {
      primarySlug: "packs-snowboard",
      allowedSlugs: [
        "packs-snowboard",
      ],
      cleanupSlugs: SNOWBOARD_PACK_CLEANUP_SLUGS,
    };
  }

if (
  categoryPathEndsWith(path, "planche de snowboard") ||
  path.includes("snowboard > planches")
) {
  const primarySlug =
    inferSnowboardBoardPrimarySlug(
      aggregated
    );

  return {
    primarySlug,
    allowedSlugs: [
      "planches-snowboard",
      primarySlug,
    ],
    cleanupSlugs: SNOWBOARD_BOARD_CLEANUP_SLUGS,
  };
}

  if (
    path.includes(
      "ekosport > nos univers > snowboard > materiel splitboard > splitboard"
    ) ||
    path.includes("snowboard > splitboard")
  ) {
    return {
      primarySlug: "splitboard",
      allowedSlugs: [
        "splitboard",
      ],
      cleanupSlugs: SNOWBOARD_SPLITBOARD_CLEANUP_SLUGS,
    };
  }

  if (
    path.includes(
      "ekosport > nos univers > snowboard > materiel snowboard > boots snowboard"
    ) ||
    path.includes("snowboard > boots")
  ) {
    const allowedSubCategories = [
      "boots-snowboard-freestyle",
      "boots-snowboard-freeride",
    ];

    const primarySlug =
      allowedSubCategories.includes(
        currentPrimarySlug
      )
        ? currentPrimarySlug
        : "boots-snowboard";

    return {
      primarySlug,
      allowedSlugs: [
        "boots-snowboard",
        primarySlug,
      ],
      cleanupSlugs: SNOWBOARD_BOOT_CLEANUP_SLUGS,
    };
  }

  if (
    path.includes(
      "ekosport > nos univers > snowboard > materiel snowboard > fixation snowboard"
    ) ||
    path.includes("snowboard > fixations")
  ) {
    const allowedSubCategories = [
      "fixations-snowboard-straps",
      "fixations-snowboard-rear-entry",
    ];

    const primarySlug =
      allowedSubCategories.includes(
        currentPrimarySlug
      )
        ? currentPrimarySlug
        : "fixations-snowboard";

    return {
      primarySlug,
      allowedSlugs: [
        "fixations-snowboard",
        primarySlug,
      ],
      cleanupSlugs: SNOWBOARD_BINDING_CLEANUP_SLUGS,
    };
  }

  if (
    path.includes(
      "ekosport > nos univers > snowboard > accessoire snowboard > housse snowboard"
    ) ||
    path.includes("bagagerie snowboard > housses")
  ) {
    return {
      primarySlug: "housses-snowboard",
      allowedSlugs: [
        "housses-snowboard",
      ],
      cleanupSlugs: SNOWBOARD_EXCLUSIVE_SLUGS,
    };
  }

  return null;
}

function buildNordicCategoryPlan(
  aggregated: AggregatedFeedItem
): GuardedCategoryPlan | null {
  const path = normalizeCategoryPath(aggregated.item.categoryPath);
  const title = buildProductOnlyGuardSearchText(aggregated);
  const currentSlug = aggregated.primaryCategory.slug;
  const nordicMapped = NORDIC_EXCLUSIVE_SLUGS.includes(currentSlug);
  const nordicPath =
    path.includes("ski de fond") ||
    path.includes("ski nordique") ||
    path.includes("skating") ||
    path.includes("ski classique") ||
    path.includes("randonnee nordique") ||
    path.includes("backcountry nordic");
  const explicitNordicTitle =
    /\b(ski de fond|ski nordique|randonnee nordique|nordic|cross country|xc ski)\b/.test(title);

  if (!nordicPath && !nordicMapped && !explicitNordicTitle) {
    return null;
  }

  // Les textiles ne deviennent jamais du materiel nordique du seul fait
  // de leur chemin marchand ou d'une mention « ski de fond ».
  if (
    /\b(vetement|veste|pantalon|collant|legging|gants|moufles|bonnet|chaussettes|sous vetement|polaires|t shirt|tee shirt|maillot|short|brassiere)\b/.test(path) ||
    /\b(veste|pantalon|collant|legging|gants|moufles|bonnet|chaussettes|sous vetement|polaire|t shirt|tee shirt|maillot|short|brassiere)\b/.test(title)
  ) {
    return null;
  }

  const leaf = path.split(" > ").pop() || "";
  const isPackPath = /\b(pack|packs)\b/.test(leaf);
  const isBootPath = /\b(chaussure|chaussures|boots)\b/.test(leaf);
  const isBindingPath = /\b(fixation|fixations)\b/.test(leaf);
  const isPolePath = /\b(baton|batons|pole|poles)\b/.test(leaf);
  const isWaxPath = /\b(fart|fartage|brosse|outil|klister)\b/.test(leaf);
  const isSkiPath = /\b(ski|skis|skating|classique)\b/.test(leaf) &&
    !/\b(accessoire|accessoires|materiel|equipement)\b/.test(leaf);
  const isSkinAccessory =
    /\b(easy skin|super skin|skin mohair|peau de phoque|peaux de phoque|peaux nordiques|peaux de retenue)\b/.test(title) &&
    !/\b(ski|skis|pack)\b/.test(title.replace(/\b(easy skin|super skin|skin mohair|peau de phoque|peaux de phoque|peaux nordiques|peaux de retenue)\b/g, ""));
  const isBackcountry =
    /\b(backcountry|back country|randonnee nordique|nordic touring|transnordic|fjelltech|outback|bcx|bc 80|bc 90|bc 100|bc 110|bc 120|xp explore|xp adventure)\b/.test(title) ||
    /\b(randonnee nordique|backcountry|back country)\b/.test(path);
  const isCombi = /\b(combi|skiathlon|pursuit)\b/.test(title);
  const style = inferNordicStyle(aggregated);

  const plan = (primarySlug: string): GuardedCategoryPlan => ({
    primarySlug,
    allowedSlugs: [primarySlug],
    cleanupSlugs: [
      ...NORDIC_EXCLUSIVE_SLUGS,
      // Anciennes affectations de batons de fond en batons alpins,
      // et de peaux nordiques dans les peaux de randonnee alpine.
      ...ALPINE_SKI_EXCLUSIVE_SLUGS.filter((slug) =>
        slug.startsWith("batons-")
      ),
      "peaux-phoque",
      "peaux-avec-colle",
      "peaux-sans-colle",
      "peaux-predecoupees",
    ],
  });

  // La nature du produit prime sur les mots « ski », « skin » et
  // sur les categories parentes trop generales des marchands.
  if (isPolePath || /\b(baton|batons|nordic poles|xc poles|ski poles|ski pole)\b/.test(title)) {
    return plan("batons-ski-nordique");
  }
  if (isWaxPath || /\b(klister|fart de glisse|fart de retenue|brosse a farter|outil de fartage)\b/.test(title)) {
    if (/\b(brosse|outil|racloir|fer a farter)\b/.test(leaf + " " + title)) {
      return plan("outils-fartage");
    }
    return plan(inferNordicFartSlug(aggregated));
  }
  if (isSkinAccessory || isBackcountry) {
    return plan("ski-randonnee-nordique");
  }
  if (isCombi) {
    return plan("equipement-ski-nordique");
  }

  const kind: "pack" | "boot" | "binding" | "ski" | "equipment" = isPackPath || /\b(pack ski|pack skis|ski pack|skis pack)\b/.test(title)
    ? "pack"
    : isBootPath || /\b(chaussure|chaussures|boots)\b/.test(title)
      ? "boot"
      : isBindingPath || /\b(fixation|fixations|bindings|binding)\b/.test(title)
        ? "binding"
        : isSkiPath || /\b(ski|skis)\b/.test(title)
          ? "ski"
          : "equipment";

  if (style === "unknown" || kind === "equipment") {
    return plan("equipement-ski-nordique");
  }
  const byKind = {
    pack: style === "classic" ? "packs-ski-classique" : "packs-skating",
    boot: style === "classic" ? "chaussures-classique" : "chaussures-skating",
    binding: style === "classic" ? "fixations-classique" : "fixations-skating",
    ski: style === "classic" ? "skis-classique" : "skis-skating",
  };
  return plan(byKind[kind]);
}

function buildAlpineSkiCategoryPlan(
  aggregated: AggregatedFeedItem
): GuardedCategoryPlan | null {
  const path = normalizeCategoryPath(
    aggregated.item.categoryPath
  );

  if (!path.includes("ski alpin")) {
    return null;
  }

  /*
   * Certains marchands (notamment Alpinstore) utilisent "Ski alpin"
   * comme catégorie source générique pour plusieurs natures de produit.
   * Sur ce chemin générique seulement, on applique quelques garde-fous
   * textuels très explicites et volontairement conservateurs.
   */
  if (path === "ski alpin") {
    const text = buildGuardSearchText(aggregated);

    if (
      text.includes("pack ski ") ||
      text.includes("pack skis ") ||
      text.startsWith("pack ski ") ||
      text.startsWith("pack skis ")
    ) {
      const primarySlug =
        inferAlpinePackSlug(aggregated);

      return {
        primarySlug,
        allowedSlugs: [primarySlug],
        cleanupSlugs: ALPINE_SKI_CROSS_FAMILY_CLEANUP_SLUGS,
      };
    }

    if (
      text.includes("baton de ski") ||
      text.includes("batons de ski") ||
      text.includes("ski pole") ||
      text.includes("ski poles")
    ) {
      const primarySlug =
        inferAlpinePoleSlug(aggregated);

      return {
        primarySlug,
        allowedSlugs: [primarySlug],
        cleanupSlugs: ALPINE_SKI_EXCLUSIVE_SLUGS,
      };
    }

    /*
     * Les semelles / sole blocks sont des accessoires de ski et non
     * des skis. La catégorie "protections-ski" correspond à
     * "Protections & accessoires ski".
     *
     * cleanupSlugs retire aussi les anciennes relations alpines
     * incompatibles lors de l'import.
     */
    if (
      text.includes("sole block") ||
      text.includes("semelle alpine") ||
      text.includes("semelles alpine") ||
      text.includes("semelle de chaussure") ||
      text.includes("semelles de chaussure")
    ) {
      return {
        primarySlug: "protections-ski",
        allowedSlugs: ["protections-ski"],
        cleanupSlugs: ALPINE_SKI_EXCLUSIVE_SLUGS,
      };
    }
  }

  /*
   * La nature du produit est prioritaire sur sa pratique :
   * un pack ne doit jamais être classé comme ski nu, et inversement.
   * On teste donc la feuille exacte du chemin source marchand.
   */
  if (categoryPathEndsWith(path, "pack ski")) {
    const primarySlug =
      inferAlpinePackSlug(aggregated);

    return {
      primarySlug,
      allowedSlugs: [primarySlug],
      cleanupSlugs: ALPINE_SKI_CROSS_FAMILY_CLEANUP_SLUGS,
    };
  }

  if (categoryPathEndsWith(path, "ski")) {
    const primarySlug =
      inferAlpineSkiSlug(aggregated);

    return {
      primarySlug,
      allowedSlugs: [primarySlug],
      cleanupSlugs: ALPINE_SKI_CROSS_FAMILY_CLEANUP_SLUGS,
    };
  }

  if (categoryPathEndsWith(path, "chaussure de ski")) {
    const primarySlug =
      inferAlpineBootSlug(aggregated);

    return {
      primarySlug,
      allowedSlugs: [primarySlug],
      cleanupSlugs: ALPINE_SKI_EXCLUSIVE_SLUGS,
    };
  }

  if (categoryPathEndsWith(path, "fixation ski")) {
    const primarySlug =
      inferAlpineBindingSlug(aggregated);

    return {
      primarySlug,
      allowedSlugs: [primarySlug],
      cleanupSlugs: ALPINE_SKI_EXCLUSIVE_SLUGS,
    };
  }

  if (categoryPathEndsWith(path, "baton de ski")) {
    const primarySlug =
      inferAlpinePoleSlug(aggregated);

    return {
      primarySlug,
      allowedSlugs: [primarySlug],
      cleanupSlugs: ALPINE_SKI_EXCLUSIVE_SLUGS,
    };
  }

  return null;
}

function inferSnowboardBoardPrimarySlug(
  aggregated: AggregatedFeedItem
): string {
  const currentPrimarySlug =
    aggregated.primaryCategory.slug;

  const allowedSubCategories = [
    "snowboard-freestyle",
    "snowboard-all-mountain",
    "snowboard-freeride",
  ];

  if (
    allowedSubCategories.includes(
      currentPrimarySlug
    )
  ) {
    return currentPrimarySlug;
  }

  const text = normalizeCategoryPath(
    [
      aggregated.item.title,
      aggregated.item.cleanName,
      aggregated.item.categoryPath,
      aggregated.groupKey,
    ]
      .filter(Boolean)
      .join(" ")
  );

  if (
    text.includes("freestyle") ||
    text.includes("park") ||
    text.includes("jib") ||
    text.includes("jibsaw") ||
    text.includes("retox") ||
    text.includes("sleepwalker") ||
    text.includes("cheap thrills") ||
    text.includes("kickback") ||
    text.includes("twin") ||
    text.includes("process") ||
    text.includes("scan") ||
    text.includes("grom") ||
    text.includes("mini") ||
    text.includes("kids") ||
    text.includes("youth")
  ) {
    return "snowboard-freestyle";
  }

  if (
    text.includes("freeride") ||
    text.includes("flagship") ||
    text.includes("hovercraft") ||
    text.includes("mind expander") ||
    text.includes("mtn pig") ||
    text.includes("mountain pig") ||
    text.includes("alchemist") ||
    text.includes("passport") ||
    text.includes("deep fake") ||
    text.includes("peace seeker") ||
    text.includes("squash") ||
    text.includes("ravine") ||
    text.includes("storm") ||
    text.includes("surfer") ||
    text.includes("freecarver")
  ) {
    return "snowboard-freeride";
  }

  return "snowboard-all-mountain";
}

function buildRandoCategoryPlan(
  aggregated: AggregatedFeedItem
): GuardedCategoryPlan | null {
  const path = normalizeCategoryPath(
    aggregated.item.categoryPath
  );

  const isRandoPath =
    path.includes("ski de randonnee") ||
    path.includes("ski randonnee");

  if (!isRandoPath) {
    return null;
  }

  if (path.includes("vetement ski de randonnee")) {
    return null;
  }

  /*
   * Alpinstore peut utiliser "Ski de randonnee" comme catégorie générique.
   * Ce chemin seul ne prouve donc pas qu'il s'agit d'un ski.
   */
  if (
    path === "ski de randonnee" ||
    path === "ski randonnee"
  ) {
    /*
     * IMPORTANT : buildGuardSearchText() contient categoryPath.
     * Ici on ne regarde que le libellé produit pour éviter que le chemin
     * générique fasse passer automatiquement tous les produits pour des skis.
     */
    const productText =
      buildProductOnlyGuardSearchText(aggregated);

    if (
      productText.includes("sac a dos") ||
      productText.includes("backpack") ||
      productText.includes("rucksack")
    ) {
      return {
        primarySlug: "sacs-ski",
        allowedSlugs: ["sacs-ski"],
        cleanupSlugs: RANDO_SKI_CROSS_FAMILY_CLEANUP_SLUGS,
      };
    }

    if (
      productText.includes("ski de randonnee") ||
      productText.includes("skis de randonnee")
    ) {
      return {
        primarySlug: "skis-randonnee",
        allowedSlugs: ["skis-randonnee"],
        cleanupSlugs: RANDO_SKI_CROSS_FAMILY_CLEANUP_SLUGS,
      };
    }

    return null;
  }

  /*
   * Flux génériques de packs complets :
   * "Packs ski de randonnee avec fixation", "... avec peaux", etc.
   * La nature PACK est prioritaire sur les composants inclus.
   */
  if (
    path.startsWith("packs ski de randonnee avec ") ||
    path.startsWith("pack ski de randonnee avec ")
  ) {
    return {
      primarySlug: "packs-ski-randonnee",
      allowedSlugs: ["packs-ski-randonnee"],
      cleanupSlugs: RANDO_SKI_CROSS_FAMILY_CLEANUP_SLUGS,
    };
  }

  if (
    categoryPathEndsWith(path, "pack ski de randonnee")
  ) {
    return {
      primarySlug: "packs-ski-randonnee",
      allowedSlugs: ["packs-ski-randonnee"],
      cleanupSlugs: RANDO_SKI_CROSS_FAMILY_CLEANUP_SLUGS,
    };
  }

  if (
    categoryPathEndsWith(path, "ski de randonnee")
  ) {
    return {
      primarySlug: "skis-randonnee",
      allowedSlugs: ["skis-randonnee"],
      cleanupSlugs: RANDO_SKI_CROSS_FAMILY_CLEANUP_SLUGS,
    };
  }

  if (
    path.includes(
      "ekosport > nos univers > ski de randonnee > materiel ski de randonnee > chaussure ski de randonnee"
    )
  ) {
    return {
      primarySlug: "chaussures-ski-randonnee",
      allowedSlugs: ["chaussures-ski-randonnee"],
      cleanupSlugs: RANDO_EXCLUSIVE_SLUGS,
    };
  }

  if (
    path.includes(
      "ekosport > nos univers > ski de randonnee > materiel ski de randonnee > fixation ski de randonnee"
    )
  ) {
    const primarySlug =
      inferRandoBindingSlug(aggregated);

    return {
      primarySlug,
      allowedSlugs: [primarySlug],
      cleanupSlugs: RANDO_EXCLUSIVE_SLUGS,
    };
  }

  if (
    path.includes(
      "ekosport > nos univers > ski de randonnee > materiel ski de randonnee > baton ski de randonnee"
    )
  ) {
    return {
      primarySlug: "batons-ski-randonnee",
      allowedSlugs: ["batons-ski-randonnee"],
      cleanupSlugs: RANDO_EXCLUSIVE_SLUGS,
    };
  }

  if (
    path.includes(
      "ekosport > nos univers > ski de randonnee > accessoire ski de randonnee > peau de phoque"
    )
  ) {
    return {
      primarySlug: "peaux-phoque",
      allowedSlugs: ["peaux-phoque"],
      cleanupSlugs: RANDO_EXCLUSIVE_SLUGS,
    };
  }

  if (
    path.includes(
      "ekosport > nos univers > ski de randonnee > accessoire ski de randonnee > couteaux ski de rando"
    )
  ) {
    return {
      primarySlug: "couteaux-ski-rando",
      allowedSlugs: ["couteaux-ski-rando"],
      cleanupSlugs: RANDO_EXCLUSIVE_SLUGS,
    };
  }

  if (path.includes("securite avalanche > dva")) {
    return {
      primarySlug: "dva-arva",
      allowedSlugs: ["dva-arva"],
      cleanupSlugs: RANDO_EXCLUSIVE_SLUGS,
    };
  }

  if (path.includes("securite avalanche > pelle avalanche")) {
    return {
      primarySlug: "pelles-avalanche",
      allowedSlugs: ["pelles-avalanche"],
      cleanupSlugs: RANDO_EXCLUSIVE_SLUGS,
    };
  }

  if (path.includes("securite avalanche > sonde avalanche")) {
    return {
      primarySlug: "sondes-avalanche",
      allowedSlugs: ["sondes-avalanche"],
      cleanupSlugs: RANDO_EXCLUSIVE_SLUGS,
    };
  }

  if (path.includes("securite avalanche")) {
    return {
      primarySlug: "securite-avalanche",
      allowedSlugs: ["securite-avalanche"],
      cleanupSlugs: RANDO_EXCLUSIVE_SLUGS,
    };
  }

  return null;
}

function inferNordicStyle(
  aggregated: AggregatedFeedItem
): "classic" | "skating" | "unknown" {
  // Le titre est prioritaire : le chemin marchand peut etre generique
  // ou provenir d'une categorie historiquement mal associee.
  const title = buildProductOnlyGuardSearchText(aggregated);
  const path = normalizeCategoryPath(aggregated.item.categoryPath);
  const classic = /\b(classic|classique|prolink cl|race cl|shift cl|r skin|e skin|eskin|skintec|twin skin|crown|positrack|waxless|kick wax|grip wax|redster c[0-9])\b/;
  const skating = /\b(skate|skating|prolink sk|race sk|redster s[0-9]|rs 8|rs 10)\b/;
  const titleClassic = classic.test(title);
  const titleSkating = skating.test(title);
  if (titleClassic !== titleSkating) {
    return titleClassic ? "classic" : "skating";
  }
  if (titleClassic && titleSkating) {
    return "unknown";
  }
  // Les feuilles specifiques des marchands peuvent preciser la pratique.
  // Ne jamais inferer une pratique de la seule racine « ski de fond ».
  const leaf = path.split(" > ").pop() || "";
  const pathClassic = /\b(classic|classique)\b/.test(leaf);
  const pathSkating = /\b(skate|skating)\b/.test(leaf);
  if (pathClassic !== pathSkating) {
    return pathClassic ? "classic" : "skating";
  }
  return "unknown";
}

function inferAlpineSkiSlug(
  aggregated: AggregatedFeedItem
): string {
  const currentPrimarySlug =
    aggregated.primaryCategory.slug;

  const allowedSlugs = [
    "skis-piste",
    "skis-all-mountain",
    "skis-freeride",
    "skis-freestyle",
    "skis-junior",
  ];

  if (allowedSlugs.includes(currentPrimarySlug)) {
    return currentPrimarySlug;
  }

  const text =
    buildGuardSearchText(aggregated);

  if (
    text.includes("junior") ||
    text.includes("jr") ||
    text.includes("kid") ||
    text.includes("kids") ||
    text.includes("bent chetler mini") ||
    text.includes("bacon shorty")
  ) {
    return "skis-junior";
  }

  if (
    text.includes("freestyle") ||
    text.includes("park") ||
    text.includes("twintip") ||
    text.includes("twin tip") ||
    text.includes("omen") ||
    text.includes("bent") ||
    text.includes("depart") ||
    text.includes("m menace")
  ) {
    return "skis-freestyle";
  }

  if (
    text.includes("freeride") ||
    text.includes("powder") ||
    text.includes("blackops") ||
    text.includes("sender") ||
    text.includes("optic") ||
    text.includes("m free") ||
    text.includes("m-free")
  ) {
    return "skis-freeride";
  }

  if (
    text.includes("piste") ||
    text.includes("race") ||
    text.includes("carver") ||
    text.includes("worldcup") ||
    text.includes("slalom") ||
    text.includes("gs ") ||
    text.includes("hero") ||
    text.includes("forza") ||
    text.includes("redster")
  ) {
    return "skis-piste";
  }

  return "skis-all-mountain";
}

function inferAlpinePackSlug(
  aggregated: AggregatedFeedItem
): string {
  const currentPrimarySlug =
    aggregated.primaryCategory.slug;

  const allowedSlugs = [
    "packs-skis-piste",
    "packs-skis-all-mountain",
    "packs-skis-freeride",
    "packs-skis-freestyle",
    "packs-skis-junior",
  ];

  if (allowedSlugs.includes(currentPrimarySlug)) {
    return currentPrimarySlug;
  }

  const skiSlug =
    inferAlpineSkiSlug(aggregated);

  switch (skiSlug) {
    case "skis-piste":
      return "packs-skis-piste";

    case "skis-freeride":
      return "packs-skis-freeride";

    case "skis-freestyle":
      return "packs-skis-freestyle";

    case "skis-junior":
      return "packs-skis-junior";

    case "skis-all-mountain":
    default:
      return "packs-skis-all-mountain";
  }
}

function inferRandoBindingSlug(
  aggregated: AggregatedFeedItem
): string {
  const currentPrimarySlug =
    aggregated.primaryCategory.slug;

  const allowedSlugs = [
    "fixations-inserts",
    "fixations-hybrides",
  ];

  if (allowedSlugs.includes(currentPrimarySlug)) {
    return currentPrimarySlug;
  }

  const text =
    buildGuardSearchText(aggregated);

  if (
    text.includes("duke") ||
    text.includes("shift") ||
    text.includes("tecton") ||
    text.includes("vipec") ||
    text.includes("kingpin")
  ) {
    return "fixations-hybrides";
  }

  if (
    text.includes("atk") ||
    text.includes("plum") ||
    text.includes("raider") ||
    text.includes("crest") ||
    text.includes("alpinist") ||
    text.includes("xenic") ||
    text.includes("backland") ||
    text.includes("summit") ||
    text.includes("speed turn") ||
    text.includes("low tech") ||
    text.includes("guide 12") ||
    text.includes("guide 7")
  ) {
    return "fixations-inserts";
  }

  return "fixations-ski-randonnee";
}

function inferAlpineBootSlug(
  aggregated: AggregatedFeedItem
): string {
  const currentPrimarySlug =
    aggregated.primaryCategory.slug;

  const allowedSlugs = [
    "chaussures-ski-piste",
    "chaussures-ski-freeride",
    "chaussures-ski-performance",
    "chaussures-ski-junior",
  ];

  if (allowedSlugs.includes(currentPrimarySlug)) {
    return currentPrimarySlug;
  }

  const text =
    buildGuardSearchText(aggregated);

  if (
    text.includes("junior") ||
    text.includes("jr") ||
    text.includes("team") ||
    text.includes("kids") ||
    text.includes("child")
  ) {
    return "chaussures-ski-junior";
  }

  if (
    text.includes("freeride") ||
    text.includes("free") ||
    text.includes("xtd") ||
    text.includes("shift") ||
    text.includes("cochise") ||
    text.includes("alltrack")
  ) {
    return "chaussures-ski-freeride";
  }

  if (
    text.includes("performance") ||
    text.includes("race") ||
    text.includes("redster") ||
    text.includes("s race") ||
    text.includes("rs ") ||
    text.includes("pro machine") ||
    text.includes("promachine") ||
    text.includes("mach1")
  ) {
    return "chaussures-ski-performance";
  }

  return "chaussures-ski-piste";
}

function inferAlpineBindingSlug(
  aggregated: AggregatedFeedItem
): string {
  const currentPrimarySlug =
    aggregated.primaryCategory.slug;

  const allowedSlugs = [
    "fixations-ski-piste",
    "fixations-ski-all-mountain",
    "fixations-ski-freeride",
  ];

  if (allowedSlugs.includes(currentPrimarySlug)) {
    return currentPrimarySlug;
  }

  const text =
    buildGuardSearchText(aggregated);

  if (
    text.includes("freeride") ||
    text.includes("jester") ||
    text.includes("griffon") ||
    text.includes("pivot") ||
    text.includes("strive 14 mn") ||
    text.includes("strive 16 mn")
  ) {
    return "fixations-ski-freeride";
  }

  if (
    text.includes("piste") ||
    text.includes("race") ||
    text.includes("xcell") ||
    text.includes("freeflex") ||
    text.includes("look nx") ||
    text.includes("nx 7") ||
    text.includes("team 4")
  ) {
    return "fixations-ski-piste";
  }

  return "fixations-ski-all-mountain";
}

function inferAlpinePoleSlug(
  aggregated: AggregatedFeedItem
): string {
  const currentPrimarySlug =
    aggregated.primaryCategory.slug;

  const allowedSlugs = [
    "batons-ski-piste",
    "batons-ski-freeride",
    "batons-ski-junior",
  ];

  if (allowedSlugs.includes(currentPrimarySlug)) {
    return currentPrimarySlug;
  }

  const text =
    buildGuardSearchText(aggregated);

  if (
    text.includes("junior") ||
    text.includes("jr") ||
    text.includes("lite gs") ||
    text.includes("lite sl")
  ) {
    return "batons-ski-junior";
  }

  if (
    text.includes("freeride") ||
    text.includes("safety") ||
    text.includes("slash") ||
    text.includes("vertical")
  ) {
    return "batons-ski-freeride";
  }

  return "batons-ski-piste";
}

function inferNordicFartSlug(
  aggregated: AggregatedFeedItem
): string {
  const text =
    buildGuardSearchText(aggregated);

  if (
    text.includes("retenue") ||
    text.includes("grip wax") ||
    text.includes("kick wax") ||
    text.includes("klister") ||
    text.includes("base binder")
  ) {
    return "fart-retenue";
  }

  return "fart-glisse";
}

function buildGuardSearchText(
  aggregated: AggregatedFeedItem
): string {
  return normalizeGuardSearchText(
    [
      aggregated.item.title,
      aggregated.item.cleanName,
      aggregated.item.categoryPath,
      aggregated.groupKey,
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function buildProductOnlyGuardSearchText(
  aggregated: AggregatedFeedItem
): string {
  return normalizeGuardSearchText(
    [
      aggregated.item.title,
      aggregated.item.cleanName,
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function normalizeGuardSearchText(
  value: string
): string {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveCategoriesWithAncestors(
  source: FeedCategoryMappings,
  slugs: string[]
): MappedCategory[] {
  const resolved = new Map<
    number,
    MappedCategory
  >();

  for (const slug of slugs) {
    const category =
      findCategoryBySlug(source, slug);

    if (!category) {
      continue;
    }

    addCategoryAndAncestors(
      source,
      category.id,
      resolved
    );
  }

  return Array.from(resolved.values());
}

function addCategoryAndAncestors(
  source: FeedCategoryMappings,
  categoryId: number,
  resolved: Map<number, MappedCategory>
): void {
  const visited = new Set<number>();

  let currentId: number | null = categoryId;

  while (currentId !== null) {
    if (visited.has(currentId)) {
      break;
    }

    visited.add(currentId);

    const category =
      source.categoriesById.get(currentId);

    if (!category) {
      break;
    }

    resolved.set(category.id, {
      id: category.id,
      slug: category.slug,
      name: category.name,
    });

    currentId = category.parentId;
  }
}

function findCategoryBySlug(
  source: FeedCategoryMappings,
  slug: string
): MappedCategory | null {
  for (const category of source.categoriesById.values()) {
    if (category.slug === slug) {
      return {
        id: category.id,
        slug: category.slug,
        name: category.name,
      };
    }
  }

  return null;
}

function categoryPathEndsWith(
  normalizedPath: string,
  leaf: string
): boolean {
  const normalizedLeaf = normalizeCategoryPath(leaf);

  return (
    normalizedPath === normalizedLeaf ||
    normalizedPath.endsWith(` > ${normalizedLeaf}`)
  );
}

function normalizeCategoryPath(
  value: string | null | undefined
): string {
  return normalizeText(value)
    .toLowerCase()
    .replace(
      /\s*(>|\/|\||»|→)\s*/g,
      " > "
    )
    .replace(/\s+/g, " ")
    .trim();
}