import type {
  AggregatedFeedItem,
  MappedCategory,
  NormalizedFeedItem,
} from "./feed-types";
import {
  buildProductGroupKey,
  cleanProductDisplayName,
  normalizeText,
} from "./normalize";

export type CategorizedFeedItem = {
  item: NormalizedFeedItem;
  category: MappedCategory;
};

export function aggregateFeedItems(
  acceptedItems: CategorizedFeedItem[]
): AggregatedFeedItem[] {
  const groups = new Map<string, CategorizedFeedItem[]>();

  for (const entry of acceptedItems) {
    const sourceKey = buildProductGroupKey(entry.item);
    const groupKey = `${entry.category.id}:${sourceKey}`;
    const group = groups.get(groupKey) ?? [];

    group.push(entry);
    groups.set(groupKey, group);
  }

  return Array.from(groups.entries()).map(([groupKey, entries]) => {
    const variants = entries.map(({ item }) => item);
    const representative = chooseRepresentative(variants);

    const availableVariants = variants.filter((item) => item.inStock);
    const availabilityPool =
      availableVariants.length > 0 ? availableVariants : variants;

    const bestOfferVariant = chooseRepresentative(availabilityPool);

    const aggregatedItem: NormalizedFeedItem = {
      ...representative,
      title: cleanProductDisplayName(representative),
      cleanName: cleanProductDisplayName(representative),
      externalId:
        representative.parentExternalId ??
        representative.externalId,
      parentExternalId:
        representative.parentExternalId ??
        representative.externalId,
      price: bestOfferVariant.price,
      oldPrice: bestOfferVariant.oldPrice,
      shippingCost: bestOfferVariant.shippingCost,
      currency: bestOfferVariant.currency,
      availability:
        availableVariants.length > 0
          ? bestOfferVariant.availability ?? "in stock"
          : bestOfferVariant.availability ?? "out of stock",
      inStock: availableVariants.length > 0,
      affiliateUrl: bestOfferVariant.affiliateUrl,
      merchantProductUrl:
        bestOfferVariant.merchantProductUrl ??
        representative.merchantProductUrl,
      imageUrl:
        bestOfferVariant.imageUrl ??
        representative.imageUrl,
    };

    return {
      groupKey,
      item: aggregatedItem,
      category: entries[0].category,
      sourceItemCount: variants.length,
      availableSizes: uniqueValues(variants.map((item) => item.size)),
      availableColors: uniqueValues(variants.map((item) => item.color)),
      availableGenders: uniqueValues(variants.map((item) => item.gender)),
    };
  });
}

function chooseRepresentative(
  items: NormalizedFeedItem[]
): NormalizedFeedItem {
  return [...items].sort((a, b) => {
    if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;
    return totalPrice(a) - totalPrice(b);
  })[0];
}

function totalPrice(item: NormalizedFeedItem): number {
  return item.price + (item.shippingCost ?? 0);
}

function uniqueValues(
  values: Array<string | null | undefined>
): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => normalizeText(value))
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b, "fr"));
}
