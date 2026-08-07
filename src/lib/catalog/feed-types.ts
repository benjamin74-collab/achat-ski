export type MerchantPlatform =
  | "KWANKO"
  | "AWIN"
  | "AFFILAE"
  | "DIRECT"
  | "OTHER";

export type FeedNormalizerConfig = {
  merchantSlug: string;
  merchantPlatform: MerchantPlatform;
};

export type FeedNormalizerContext = {
  config: FeedNormalizerConfig;
};

/**
 * Représentation normalisée d'une ligne provenant
 * d'un flux marchand.
 */
export interface NormalizedFeedItem {
  merchantSlug: string;
  merchantPlatform: MerchantPlatform;

  externalId?: string;
  parentExternalId?: string;
  manufacturerReference?: string;

  title: string;
  cleanName?: string;
  brand?: string;
  description?: string;
  categoryPath?: string;
  gtin?: string;

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
  | "GTIN"
  | "MERCHANT_PARENT_EXTERNAL_ID"
  | "MERCHANT_EXTERNAL_ID"
  | "BRAND_MANUFACTURER_REFERENCE"
  | "BRAND_STYLE_CODE"
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

  /**
   * Identifiants collectés sur toutes les variantes du groupe.
   * Un Product représente une gamme / modèle, alors que les GTIN
   * sont souvent au niveau taille + couleur.
   */
  variantGtins: string[];
  manufacturerReferences: string[];
  styleCodes: string[];
  merchantExternalIds: string[];
  merchantParentExternalIds: string[];
  sourceGroupKeys: string[];
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

export interface FeedImportResult
  extends ImportStats {
  feedImportId: number;
  feedKey: string;
  status: string;
}

export function createEmptyImportStats(
  totalRows = 0
): ImportStats {
  return {
    totalRows,
    normalizedRows: 0,
    acceptedRows: 0,
    skippedRows: 0,
    groupedProducts: 0,

    createdProducts: 0,
    updatedProducts: 0,
    createdOffers: 0,
    updatedOffers: 0,

    deactivatedOffers: 0,
    deactivatedProducts: 0,
    deletedProducts: 0,

    errors: 0,
  };
}