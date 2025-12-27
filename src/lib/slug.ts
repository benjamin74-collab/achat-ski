// src/lib/slug.ts
export function slugify(input: string, max = 120): string {
  const out = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")   // retire les diacritiques
    .toLowerCase()
    .replace(/['’]/g, "")              // enlève les apostrophes
    .trim()
    .replace(/[^a-z0-9]+/g, "-")       // remplace tout le reste par des tirets
    .replace(/^-+|-+$/g, "")           // trim tirets
    .slice(0, max)                     // limite la longueur
    .replace(/^-+|-+$/g, "");          // re-trim si coupé au milieu d’un tiret

  return out || "n-a";
}