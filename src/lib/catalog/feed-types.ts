export type MerchantPlatform =
  | "KWANKO"
  | "AWIN"
  | "AFFILAE"
  | "DIRECT"
  | "OTHER";

/**
 * Représentation normalisée d'une ligne provenant d'un flux marchand.
 */
export interface NormalizedFeedItem {
  merchantSlug: string;
  merchantPlatform: MerchantPlatform;

  externalId?: string;
  parentExternalId?: string;
  ean?: string;
  manufacturerReference?: string;

  title: string;
  cleanName?: string;
  brand?: string;
  description?: string;
  categoryPath?: string;

  size?: string;
  color?: string;
  gender?: string;

  price: number;
  oldPrice?: number;
  shippingCost?: number;
  currency: string;

  availability?: string;
  inStock: boolean;

  affiliateUrl: string;
  merchantProductUrl?: string;
  imageUrl?: string;

  rawData: Record<string, unknown>;
}

export type MatchingReason =
  | "MERCHANT_PARENT_EXTERNAL_ID"
  | "MERCHANT_EXTERNAL_ID"
  | "BRAND_MANUFACTURER_REFERENCE"
  | "BRAND_NORMALIZED_NAME"
  | "NEW_PRODUCT";

export interface MatchingResult {
  productId?: number;
  confidence: number;
  reason: MatchingReason;
}

export type MappedCategory = {
  id: number;
  slug: string;
  name: string;
};

/**
 * Résultat du mapping d'une catégorie marchande.
 *
 * primaryCategory :
 * catégorie la plus précise utilisée par Product.categoryId.
 *
 * categories :
 * toutes les catégories pertinentes, y compris la catégorie principale
 * et les catégories parentes ou transversales.
 */
export type CategoryResolution = {
  primaryCategory: MappedCategory;
  categories: MappedCategory[];
};

export interface AggregatedFeedItem {
  groupKey: string;
  item: NormalizedFeedItem;

  primaryCategory: MappedCategory;
  categories: MappedCategory[];

  sourceItemCount: number;
  availableSizes: string[];
  availableColors: string[];
  availableGenders: string[];
}

export type ImportStats = {
  totalRows: number;
  normalizedRows: number;
  acceptedRows: number;
  skippedRows: number;
  groupedProducts: number;

  createdProducts: number;
  updatedProducts: number;
  createdOffers: number;
  updatedOffers: number;

  deactivatedOffers: number;
  deactivatedProducts: number;
  deletedProducts: number;
  errors: number;
};

export interface FeedImportResult extends ImportStats {
  feedImportId: number;
  feedKey: string;
  status: string;
}