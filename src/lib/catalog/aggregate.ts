import type {
  AggregatedFeedItem,
  CategoryResolution,
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
  categoryResolution: CategoryResolution;
};

export function aggregateFeedItems(
  acceptedItems: CategorizedFeedItem[]
): AggregatedFeedItem[] {
  const groups = new Map<
    string,
    CategorizedFeedItem[]
  >();

  for (const entry of acceptedItems) {
    const groupKey = buildProductGroupKey(
      entry.item
    );

    const group = groups.get(groupKey) ?? [];

    group.push(entry);
    groups.set(groupKey, group);
  }

  return Array.from(groups.entries()).map(
    ([groupKey, entries]) => {
      const variants = entries.map(
        ({ item }) => item
      );

      const representative =
        chooseRepresentative(variants);

      const availableVariants = variants.filter(
        (item) => item.inStock
      );

      const availabilityPool =
        availableVariants.length > 0
          ? availableVariants
          : variants;

      const bestOfferVariant =
        chooseRepresentative(availabilityPool);

      const aggregatedItem: NormalizedFeedItem = {
        ...representative,

        title:
          cleanProductDisplayName(
            representative
          ),

        cleanName:
          cleanProductDisplayName(
            representative
          ),

        externalId:
          representative.parentExternalId ??
          representative.externalId,

        parentExternalId:
          representative.parentExternalId ??
          representative.externalId,

        price: bestOfferVariant.price,
        oldPrice: bestOfferVariant.oldPrice,

        shippingCost:
          bestOfferVariant.shippingCost,

        currency: bestOfferVariant.currency,

        availability:
          availableVariants.length > 0
            ? bestOfferVariant.availability ??
              "in stock"
            : bestOfferVariant.availability ??
              "out of stock",

        inStock: availableVariants.length > 0,

        affiliateUrl:
          bestOfferVariant.affiliateUrl,

        merchantProductUrl:
          bestOfferVariant.merchantProductUrl ??
          representative.merchantProductUrl,

        imageUrl:
          bestOfferVariant.imageUrl ??
          representative.imageUrl,
      };

      const categories =
        mergeCategories(entries);

      const primaryCategory =
        choosePrimaryCategory(entries);

      return {
        groupKey,
        item: aggregatedItem,
        primaryCategory,
        categories,
        sourceItemCount: variants.length,

        availableSizes: uniqueValues(
          variants.map((item) => item.size)
        ),

        availableColors: uniqueValues(
          variants.map((item) => item.color)
        ),

        availableGenders: uniqueValues(
          variants.map((item) => item.gender)
        ),
      };
    }
  );
}

/**
 * Conserve toutes les catégories rencontrées sur les variantes
 * d'un même produit.
 */
function mergeCategories(
  entries: CategorizedFeedItem[]
): MappedCategory[] {
  const categoryMap = new Map<
    number,
    MappedCategory
  >();

  for (const entry of entries) {
    for (const category of entry
      .categoryResolution.categories) {
      if (!categoryMap.has(category.id)) {
        categoryMap.set(
          category.id,
          category
        );
      }
    }
  }

  return Array.from(categoryMap.values());
}

/**
 * Le premier élément correspond normalement au mapping
 * le plus précis.
 *
 * En cas de variantes possédant différents chemins, on retient
 * la catégorie principale la plus fréquemment rencontrée.
 */
function choosePrimaryCategory(
  entries: CategorizedFeedItem[]
): MappedCategory {
  const frequencies = new Map<
    number,
    {
      category: MappedCategory;
      count: number;
    }
  >();

  for (const entry of entries) {
    const category =
      entry.categoryResolution.primaryCategory;

    const existing = frequencies.get(
      category.id
    );

    frequencies.set(category.id, {
      category,
      count: (existing?.count ?? 0) + 1,
    });
  }

  const best = Array.from(
    frequencies.values()
  ).sort((a, b) => b.count - a.count)[0];

  if (!best) {
    throw new Error(
      "Aucune catégorie principale disponible pour le groupe produit."
    );
  }

  return best.category;
}

function chooseRepresentative(
  items: NormalizedFeedItem[]
): NormalizedFeedItem {
  return [...items].sort((a, b) => {
    if (a.inStock !== b.inStock) {
      return a.inStock ? -1 : 1;
    }

    return totalPrice(a) - totalPrice(b);
  })[0];
}

function totalPrice(
  item: NormalizedFeedItem
): number {
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