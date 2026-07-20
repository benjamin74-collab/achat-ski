export type MerchantPlatform =
  | "KWANKO"
  | "AWIN"
  | "AFFILAE"
  | "DIRECT"
  | "OTHER";

/**
 * Représentation normalisée d'une ligne provenant d'un flux marchand.
 *
 * Tous les importeurs doivent retourner exactement cette structure,
 * quel que soit le marchand ou la plateforme d'affiliation.
 */
export interface NormalizedFeedItem {
  merchantSlug: string;

  /**
   * Plateforme d'affiliation.
   */
  merchantPlatform: MerchantPlatform;

  /**
   * Identifiant unique de la variante chez le marchand.
   * Ex : 9-102838V0126
   */
  externalId?: string;

  /**
   * Identifiant parent du produit chez le marchand.
   * Ex : 9-102838 chez Ekosport.
   */
  parentExternalId?: string;

  /**
   * EAN / GTIN de la variante.
   */
  ean?: string;

  /**
   * Référence fabricant.
   */
  manufacturerReference?: string;

  /**
   * Nom complet reçu dans le flux.
   */
  title: string;

  /**
   * Nom nettoyé, si le marchand fournit déjà un nom produit propre.
   */
  cleanName?: string;

  brand?: string;

  description?: string;

  /**
   * Catégorie complète du marchand.
   */
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

  /**
   * Données brutes du flux.
   */
  rawData: Record<string, unknown>;
}

export type MatchingReason =
  | "EAN"
  | "BRAND_MANUFACTURER_REFERENCE_SIZE"
  | "BRAND_MANUFACTURER_REFERENCE"
  | "BRAND_NORMALIZED_NAME_VARIANT"
  | "BRAND_NORMALIZED_NAME"
  | "NEW_PRODUCT"
  | "NEW_SKU";

export interface MatchingResult {
  productId?: number;
  skuId?: number;
  confidence: number;
  reason: MatchingReason;
}

export interface FeedImportResult {
  totalRows: number;
  createdProducts: number;
  updatedProducts: number;
  createdSkus: number;
  updatedSkus: number;
  createdOffers: number;
  updatedOffers: number;
  errors: number;
}