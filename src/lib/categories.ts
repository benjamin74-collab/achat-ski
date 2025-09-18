export const CATEGORY_LABEL: Record<string, string> = {
  "skis-all-mountain": "Skis All-Mountain",
  "skis-rando": "Ski de rando",
  "fixations": "Fixations",
  "chaussures": "Chaussures",
};

export function categoryLabel(slug: string) {
  return CATEGORY_LABEL[slug] ?? slug;
}
