export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}
