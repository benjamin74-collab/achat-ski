import type { NormalizedFeedItem } from "./feed-types";

export type FeedValidationResult =
  | {
      valid: true;
      item: NormalizedFeedItem;
    }
  | {
      valid: false;
      item: NormalizedFeedItem;
      errors: string[];
    };

export function validateFeedItem(
  item: NormalizedFeedItem
): FeedValidationResult {
  const errors: string[] = [];

  if (!item.merchantSlug) {
    errors.push("Marchand manquant.");
  }

  if (!item.title) {
    errors.push("Titre produit manquant.");
  }

  if (!item.affiliateUrl) {
    errors.push("URL affiliée manquante.");
  }

  if (!item.price || item.price <= 0) {
    errors.push("Prix invalide ou manquant.");
  }

  if (item.gtin && !isValidGtin(item.gtin)) {
    errors.push(`GTIN invalide : ${item.gtin}`);
  }

  if (
    !item.externalId &&
    !item.gtin &&
    !item.manufacturerReference
  ) {
    errors.push(
      "Aucun identifiant exploitable : externalId, GTIN ou référence fabricant manquant."
    );
  }

  if (errors.length > 0) {
    return {
      valid: false,
      item,
      errors,
    };
  }

  return {
    valid: true,
    item,
  };
}

export function validateFeedItems(
  items: NormalizedFeedItem[]
): FeedValidationResult[] {
  return items.map(validateFeedItem);
}

function isValidGtin(value: string): boolean {
  const digits = value.replace(/\D/g, "");

  return (
    digits.length === 8 ||
    digits.length === 12 ||
    digits.length === 13 ||
    digits.length === 14
  );
}