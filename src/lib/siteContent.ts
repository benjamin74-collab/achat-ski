import type {
  BrandsPageContent,
  SiteContentSettings,
} from "@/config/site.types";

export const DEFAULT_BRANDS_CONTENT: BrandsPageContent = {
  eyebrow: "Annuaire des marques",
  title: "Toutes les marques",
  description:
    "Retrouvez les principales marques référencées sur notre comparateur.",

  searchLabel: "Rechercher une marque",
  searchPlaceholder: "Rechercher une marque...",

  resultSingular: "marque",
  resultPlural: "marques",
  displayedSingular: "affichée",
  displayedPlural: "affichées",

  popularTitle: "Marques populaires",
  popularDescription: "Découvrez les marques les plus consultées.",

  emptyTitle: "Aucune marque trouvée.",
  emptyDescription: "Essayez avec une autre recherche.",

  seoTitle: "Découvrir toutes les marques",
  seoParagraphs: [
    "Cette page rassemble l’ensemble des marques présentes sur notre comparateur.",
    "Consultez chaque fiche pour découvrir les produits, les gammes et les informations principales de la marque.",
  ],

  cardCta: "Voir la marque →",
  itemListName: "Annuaire des marques",

  breadcrumbHomeLabel: "Accueil",
  breadcrumbBrandsLabel: "Marques",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : fallback;
}

function asStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const values = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  return values.length > 0 ? values : fallback;
}

export function parseSiteContentSettings(
  value: unknown,
): SiteContentSettings {
  if (!isRecord(value)) {
    return {};
  }

  return value as SiteContentSettings;
}

export function resolveBrandsContent(
  value: unknown,
): BrandsPageContent {
  const settings = parseSiteContentSettings(value);
  const brands = isRecord(settings.brands) ? settings.brands : {};

  return {
    eyebrow: asString(
      brands.eyebrow,
      DEFAULT_BRANDS_CONTENT.eyebrow,
    ),
    title: asString(
      brands.title,
      DEFAULT_BRANDS_CONTENT.title,
    ),
    description: asString(
      brands.description,
      DEFAULT_BRANDS_CONTENT.description,
    ),

    searchLabel: asString(
      brands.searchLabel,
      DEFAULT_BRANDS_CONTENT.searchLabel,
    ),
    searchPlaceholder: asString(
      brands.searchPlaceholder,
      DEFAULT_BRANDS_CONTENT.searchPlaceholder,
    ),

    resultSingular: asString(
      brands.resultSingular,
      DEFAULT_BRANDS_CONTENT.resultSingular,
    ),
    resultPlural: asString(
      brands.resultPlural,
      DEFAULT_BRANDS_CONTENT.resultPlural,
    ),
    displayedSingular: asString(
      brands.displayedSingular,
      DEFAULT_BRANDS_CONTENT.displayedSingular,
    ),
    displayedPlural: asString(
      brands.displayedPlural,
      DEFAULT_BRANDS_CONTENT.displayedPlural,
    ),

    popularTitle: asString(
      brands.popularTitle,
      DEFAULT_BRANDS_CONTENT.popularTitle,
    ),
    popularDescription: asString(
      brands.popularDescription,
      DEFAULT_BRANDS_CONTENT.popularDescription,
    ),

    emptyTitle: asString(
      brands.emptyTitle,
      DEFAULT_BRANDS_CONTENT.emptyTitle,
    ),
    emptyDescription: asString(
      brands.emptyDescription,
      DEFAULT_BRANDS_CONTENT.emptyDescription,
    ),

    seoTitle: asString(
      brands.seoTitle,
      DEFAULT_BRANDS_CONTENT.seoTitle,
    ),
    seoParagraphs: asStringArray(
      brands.seoParagraphs,
      DEFAULT_BRANDS_CONTENT.seoParagraphs,
    ),

    cardCta: asString(
      brands.cardCta,
      DEFAULT_BRANDS_CONTENT.cardCta,
    ),
    itemListName: asString(
      brands.itemListName,
      DEFAULT_BRANDS_CONTENT.itemListName,
    ),

    breadcrumbHomeLabel: asString(
      brands.breadcrumbHomeLabel,
      DEFAULT_BRANDS_CONTENT.breadcrumbHomeLabel,
    ),
    breadcrumbBrandsLabel: asString(
      brands.breadcrumbBrandsLabel,
      DEFAULT_BRANDS_CONTENT.breadcrumbBrandsLabel,
    ),
  };
}