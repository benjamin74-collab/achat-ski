import type { NormalizedFeedItem } from "./feed-types";

export function normalizeText(value: string | null | undefined): string {
  if (!value) return "";

  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&amp;/gi, "&")
    .replace(/&#039;/g, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function slugify(value: string | null | undefined): string {
  const normalized = normalizeText(value).toLowerCase();

  return normalized
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
}

export function toPriceCents(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;

  const parsed =
    typeof value === "number"
      ? value
      : Number(String(value).replace(",", ".").trim());

  if (!Number.isFinite(parsed)) return 0;

  return Math.round(parsed * 100);
}

export function normalizeEan(value: string | null | undefined): string | undefined {
  const digits = String(value ?? "").replace(/\D/g, "");

  if (!digits) return undefined;

  return digits;
}

export function normalizeBrandName(value: string | null | undefined): string | undefined {
  const normalized = normalizeText(value);

  if (!normalized) return undefined;

  return normalized.toUpperCase();
}

export function normalizeAvailability(value: string | null | undefined): boolean {
  const normalized = normalizeText(value).toLowerCase();

  if (!normalized) return false;

  return [
    "in stock",
    "en stock",
    "available",
    "disponible",
    "1",
    "true",
    "yes",
    "oui"
  ].includes(normalized);
}

export function normalizeProductName(value: string | null | undefined): string {
  let normalized = normalizeText(value).toUpperCase();

  normalized = normalized
    .replace(/\bGORE[\s-]?TEX\b/g, "GTX")
    .replace(/\bGORETEX\b/g, "GTX")
    .replace(/\bWOMEN\b/g, "W")
    .replace(/\bWOMAN\b/g, "W")
    .replace(/\bFEMME\b/g, "W")
    .replace(/\bMEN\b/g, "M")
    .replace(/\bHOMME\b/g, "M")
    .replace(/\bUNISEXE\b/g, "MIXTE");

  normalized = normalized
    .replace(/\bTAILLE\s+[A-Z0-9./-]+\b/g, "")
    .replace(/\bSIZE\s+[A-Z0-9./-]+\b/g, "")
    .replace(/\b\d{4}\b/g, "")
    .replace(/\s+-\s+.*$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return normalized;
}

export function normalizeVariant(item: Pick<NormalizedFeedItem, "size" | "color" | "gender">): string {
  return [item.size, item.color, item.gender]
    .map((value) => normalizeText(value).toUpperCase())
    .filter(Boolean)
    .join(" | ");
}

export function buildProductSlug(item: Pick<NormalizedFeedItem, "brand" | "cleanName" | "title">): string {
  const name = item.cleanName || item.title;
  const base = [item.brand, normalizeProductName(name)].filter(Boolean).join(" ");

  return slugify(base);
}

export function safeString(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;

  const normalized = normalizeText(String(value));

  return normalized || undefined;
}

export function safeNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;

  const parsed = Number(String(value).replace(",", ".").trim());

  return Number.isFinite(parsed) ? parsed : undefined;
}

export function decodeHtml(value: string | null | undefined): string | undefined {
  const normalized = normalizeText(value);

  return normalized || undefined;
}