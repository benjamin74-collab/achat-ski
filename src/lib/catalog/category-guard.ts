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
  buildAlpineSkiCategoryPlan(aggregated);

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
    path.includes(
      "ekosport > nos univers > snowboard > materiel snowboard > pack snowboard"
    ) ||
    path.includes("snowboard > packs")
  ) {
    return {
      primarySlug: "packs-snowboard",
      allowedSlugs: [
        "packs-snowboard",
      ],
      cleanupSlugs: SNOWBOARD_EXCLUSIVE_SLUGS,
    };
  }

if (
  path.includes(
    "ekosport > nos univers > snowboard > materiel snowboard > planche de snowboard"
  ) ||
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
    cleanupSlugs: SNOWBOARD_EXCLUSIVE_SLUGS,
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
      cleanupSlugs: SNOWBOARD_EXCLUSIVE_SLUGS,
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
      cleanupSlugs: SNOWBOARD_EXCLUSIVE_SLUGS,
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
      cleanupSlugs: SNOWBOARD_EXCLUSIVE_SLUGS,
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
  const path = normalizeCategoryPath(
    aggregated.item.categoryPath
  );

  if (!path.includes("ski de fond")) {
    return null;
  }

  /*
   * Les vêtements ski de fond doivent rester dans les familles textile.
   * On ne les force pas dans ski-nordique.
   */
  if (
    path.includes("vetement ski de fond") ||
    path.includes("veste ski de fond")
  ) {
    return null;
  }

  if (
    path.includes(
      "ekosport > nos univers > ski de fond > materiel ski de fond > pack ski de fond"
    )
  ) {
    const primarySlug =
      inferNordicStyle(aggregated) === "classic"
        ? "packs-ski-classique"
        : "packs-skating";

    return {
      primarySlug,
      allowedSlugs: [
        primarySlug,
      ],
      cleanupSlugs: NORDIC_EXCLUSIVE_SLUGS,
    };
  }

  if (
    path.includes(
      "ekosport > nos univers > ski de fond > materiel ski de fond > ski de fond"
    )
  ) {
    const primarySlug =
      inferNordicStyle(aggregated) === "classic"
        ? "skis-classique"
        : "skis-skating";

    return {
      primarySlug,
      allowedSlugs: [
        primarySlug,
      ],
      cleanupSlugs: NORDIC_EXCLUSIVE_SLUGS,
    };
  }

  if (
    path.includes(
      "ekosport > nos univers > ski de fond > materiel ski de fond > chaussure ski de fond"
    )
  ) {
    const primarySlug =
      inferNordicStyle(aggregated) === "classic"
        ? "chaussures-classique"
        : "chaussures-skating";

    return {
      primarySlug,
      allowedSlugs: [
        primarySlug,
      ],
      cleanupSlugs: NORDIC_EXCLUSIVE_SLUGS,
    };
  }

  if (
    path.includes(
      "ekosport > nos univers > ski de fond > materiel ski de fond > fixation ski de fond"
    )
  ) {
    const primarySlug =
      inferNordicStyle(aggregated) === "classic"
        ? "fixations-classique"
        : "fixations-skating";

    return {
      primarySlug,
      allowedSlugs: [
        primarySlug,
      ],
      cleanupSlugs: NORDIC_EXCLUSIVE_SLUGS,
    };
  }

  /*
   * Pas de sous-catégorie dédiée aux bâtons nordiques pour l'instant.
   */
  if (
    path.includes(
      "ekosport > nos univers > ski de fond > materiel ski de fond > baton ski de fond"
    )
  ) {
    return {
      primarySlug: "ski-nordique",
      allowedSlugs: [
        "ski-nordique",
      ],
      cleanupSlugs: NORDIC_EXCLUSIVE_SLUGS,
    };
  }

  if (
    path.includes(
      "ekosport > nos univers > ski de fond > accessoire ski de fond > brosse a farter"
    )
  ) {
    return {
      primarySlug: "outils-fartage",
      allowedSlugs: [
        "outils-fartage",
      ],
      cleanupSlugs: NORDIC_EXCLUSIVE_SLUGS,
    };
  }

  if (
    path.includes(
      "ekosport > nos univers > ski de fond > accessoire ski de fond > fart ski de fond"
    )
  ) {
    const primarySlug =
      inferNordicFartSlug(aggregated);

    return {
      primarySlug,
      allowedSlugs: [
        primarySlug,
      ],
      cleanupSlugs: NORDIC_EXCLUSIVE_SLUGS,
    };
  }

  return null;
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

  if (
    path.includes(
      "ekosport > nos univers > ski alpin > materiel ski > ski"
    )
  ) {
    const primarySlug =
      inferAlpineSkiSlug(aggregated);

    return {
      primarySlug,
      allowedSlugs: [
        primarySlug,
      ],
      cleanupSlugs: ALPINE_SKI_EXCLUSIVE_SLUGS,
    };
  }

  if (
    path.includes(
      "ekosport > nos univers > ski alpin > materiel ski > pack ski"
    )
  ) {
    const primarySlug =
      inferAlpinePackSlug(aggregated);

    return {
      primarySlug,
      allowedSlugs: [
        primarySlug,
      ],
      cleanupSlugs: ALPINE_SKI_EXCLUSIVE_SLUGS,
    };
  }

  if (
    path.includes(
      "ekosport > nos univers > ski alpin > materiel ski > chaussure de ski"
    )
  ) {
    const primarySlug =
      inferAlpineBootSlug(aggregated);

    return {
      primarySlug,
      allowedSlugs: [
        primarySlug,
      ],
      cleanupSlugs: ALPINE_SKI_EXCLUSIVE_SLUGS,
    };
  }

  if (
    path.includes(
      "ekosport > nos univers > ski alpin > materiel ski > fixation ski"
    )
  ) {
    const primarySlug =
      inferAlpineBindingSlug(aggregated);

    return {
      primarySlug,
      allowedSlugs: [
        primarySlug,
      ],
      cleanupSlugs: ALPINE_SKI_EXCLUSIVE_SLUGS,
    };
  }

  if (
    path.includes(
      "ekosport > nos univers > ski alpin > materiel ski > baton de ski"
    )
  ) {
    const primarySlug =
      inferAlpinePoleSlug(aggregated);

    return {
      primarySlug,
      allowedSlugs: [
        primarySlug,
      ],
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

function inferNordicStyle(
  aggregated: AggregatedFeedItem
): "classic" | "skating" {
  const text =
    buildGuardSearchText(aggregated);

  /*
   * On teste d'abord le classique, car certains produits
   * classiques contiennent "skin", "skintec" ou "e-skin",
   * qui pourraient sinon être confondus avec "sk".
   */
  if (
    text.includes("classic") ||
    text.includes("classique") ||
    text.includes("prolink classic") ||
    text.includes("shift classic") ||
    text.includes("race cl") ||
    text.includes("shift race cl") ||
    text.includes("pro c1") ||
    text.includes("redster c") ||
    text.includes("rc classic") ||
    text.includes("rc3 classic") ||
    text.includes("rc5 classic") ||
    text.includes("rcs classic") ||
    text.includes("x ium classic") ||
    text.includes("x ium junior cl") ||
    text.includes("x ium r skin") ||
    text.includes("r skin") ||
    text.includes("e skin") ||
    text.includes("eskin") ||
    text.includes("skintec") ||
    text.includes("skin") ||
    text.includes("twin skin") ||
    text.includes("crown") ||
    text.includes("grip") ||
    text.includes("positrack") ||
    text.includes("waxless") ||
    text.includes("bc ") ||
    text.includes("bcx") ||
    text.includes("outback") ||
    text.includes("outside") ||
    text.includes("panorama") ||
    text.includes("transnordic") ||
    text.includes("fjelltech") ||
    text.includes("escape snow") ||
    text.includes("escape outpath") ||
    text.includes("escape outrack") ||
    text.includes("xp ")
  ) {
    return "classic";
  }

  if (
    text.includes("skate") ||
    text.includes("skating") ||
    text.includes("carbon skate") ||
    text.includes("carbonlite skate") ||
    text.includes("race pro skate") ||
    text.includes("race speed skate") ||
    text.includes("redline skate") ||
    text.includes("redster s5") ||
    text.includes("redster s7") ||
    text.includes("redster s9") ||
    text.includes("rs 8") ||
    text.includes("rs 10") ||
    text.includes("s race skate") ||
    text.includes("s max skate") ||
    text.includes("s lab skate") ||
    text.includes("speedmax 80 skate") ||
    text.includes("speedmax 90 skate") ||
    text.includes("speedmax 100") ||
    text.includes("x ium skating") ||
    text.includes("aerolite skate") ||
    text.includes("aeroguide skate") ||
    text.includes("delta comp skating") ||
    text.includes("delta course skating") ||
    text.includes("skiathlon") ||
    text.includes("combi")
  ) {
    return "skating";
  }

  /*
   * Par défaut : classique.
   * C'est le choix le moins risqué pour les skis nordiques BC,
   * peaux, écailles, junior loisir, randonnée nordique.
   */
  return "classic";
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