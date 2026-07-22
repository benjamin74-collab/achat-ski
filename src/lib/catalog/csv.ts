export type CsvRow = Record<string, string>;

export type SupportedDelimiter =
  | ","
  | ";"
  | "|"
  | "\t";

type ParseCsvOptions = {
  delimiter?: string;
};

/**
 * Parse un flux texte délimité et retourne une liste d'objets
 * utilisant la première ligne comme en-têtes.
 *
 * Compatible avec :
 * - virgule
 * - point-virgule
 * - pipe
 * - tabulation
 * - champs entourés de guillemets
 * - guillemets échappés avec ""
 * - retours à la ligne dans les champs entre guillemets
 * - BOM UTF-8 sur la première colonne
 */
export function parseCsv(
  content: string,
  options: ParseCsvOptions = {}
): CsvRow[] {
  const normalizedContent =
    normalizeContent(content);

  if (!normalizedContent.trim()) {
    return [];
  }

  const delimiter =
    normalizeDelimiter(
      options.delimiter ??
        detectDelimiter(normalizedContent)
    );

  const rows = parseDelimitedRows(
    normalizedContent,
    delimiter
  );

  if (rows.length === 0) {
    return [];
  }

  const headers = normalizeHeaders(rows[0]);

  if (headers.length === 0) {
    return [];
  }

  return rows
    .slice(1)
    .filter((values) =>
      values.some(
        (value) => value.trim() !== ""
      )
    )
    .map((values) =>
      buildCsvRow(headers, values)
    );
}

/**
 * Détecte automatiquement le séparateur le plus probable
 * à partir de la première ligne exploitable.
 */
export function detectDelimiter(
  content: string
): SupportedDelimiter {
  const firstRecord =
    extractFirstRecord(content);

  const candidates: SupportedDelimiter[] =
    [",", ";", "|", "\t"];

  let bestDelimiter: SupportedDelimiter =
    ";";

  let bestCount = -1;

  for (const delimiter of candidates) {
    const count =
      countDelimiterOutsideQuotes(
        firstRecord,
        delimiter
      );

    if (count > bestCount) {
      bestCount = count;
      bestDelimiter = delimiter;
    }
  }

  return bestDelimiter;
}

/**
 * Convertit différentes représentations du séparateur
 * vers une valeur réellement exploitable.
 */
export function normalizeDelimiter(
  value: string | null | undefined
): SupportedDelimiter {
  const normalized =
    value?.trim().toLowerCase();

  if (
    normalized === "\\t" ||
    normalized === "tab" ||
    normalized === "tabulation" ||
    normalized === "tsv"
  ) {
    return "\t";
  }

  if (normalized === ",") {
    return ",";
  }

  if (normalized === "|") {
    return "|";
  }

  return ";";
}

function normalizeContent(
  content: string
): string {
  return content
    .replace(/^\uFEFF/, "")
    .replace(/\u0000/g, "");
}

function normalizeHeaders(
  rawHeaders: string[]
): string[] {
  const usedHeaders =
    new Map<string, number>();

  return rawHeaders.map(
    (rawHeader, index) => {
      const initialHeader =
        cleanCellValue(rawHeader)
          .replace(/^\uFEFF/, "")
          .trim();

      const baseHeader =
        initialHeader ||
        `column_${index + 1}`;

      const duplicateCount =
        usedHeaders.get(baseHeader) ?? 0;

      usedHeaders.set(
        baseHeader,
        duplicateCount + 1
      );

      if (duplicateCount === 0) {
        return baseHeader;
      }

      return `${baseHeader}_${duplicateCount + 1}`;
    }
  );
}

function buildCsvRow(
  headers: string[],
  values: string[]
): CsvRow {
  const row: CsvRow = {};

  headers.forEach((header, index) => {
    row[header] =
      cleanCellValue(
        values[index] ?? ""
      );
  });

  return row;
}

function cleanCellValue(
  value: string
): string {
  return value.trim();
}

function parseDelimitedRows(
  content: string,
  delimiter: string
): string[][] {
  const rows: string[][] = [];

  let currentRow: string[] = [];
  let currentValue = "";
  let insideQuotes = false;

  for (
    let index = 0;
    index < content.length;
    index += 1
  ) {
    const char = content[index];
    const nextChar =
      content[index + 1];

    if (
      char === '"' &&
      insideQuotes &&
      nextChar === '"'
    ) {
      currentValue += '"';
      index += 1;

      continue;
    }

    if (char === '"') {
      insideQuotes = !insideQuotes;

      continue;
    }

    if (
      char === delimiter &&
      !insideQuotes
    ) {
      currentRow.push(currentValue);
      currentValue = "";

      continue;
    }

    if (
      (char === "\n" ||
        char === "\r") &&
      !insideQuotes
    ) {
      if (
        char === "\r" &&
        nextChar === "\n"
      ) {
        index += 1;
      }

      currentRow.push(currentValue);

      if (
        currentRow.some(
          (value) =>
            value.trim() !== ""
        )
      ) {
        rows.push(currentRow);
      }

      currentRow = [];
      currentValue = "";

      continue;
    }

    currentValue += char;
  }

  currentRow.push(currentValue);

  if (
    currentRow.some(
      (value) => value.trim() !== ""
    )
  ) {
    rows.push(currentRow);
  }

  return rows;
}

/**
 * Extrait le premier enregistrement complet sans être perturbé
 * par un éventuel retour à la ligne contenu dans un champ cité.
 */
function extractFirstRecord(
  content: string
): string {
  let record = "";
  let insideQuotes = false;

  for (
    let index = 0;
    index < content.length;
    index += 1
  ) {
    const char = content[index];
    const nextChar =
      content[index + 1];

    if (
      char === '"' &&
      insideQuotes &&
      nextChar === '"'
    ) {
      record += '""';
      index += 1;

      continue;
    }

    if (char === '"') {
      insideQuotes = !insideQuotes;
      record += char;

      continue;
    }

    if (
      !insideQuotes &&
      (char === "\n" ||
        char === "\r")
    ) {
      break;
    }

    record += char;
  }

  return record;
}

function countDelimiterOutsideQuotes(
  record: string,
  delimiter: string
): number {
  let count = 0;
  let insideQuotes = false;

  for (
    let index = 0;
    index < record.length;
    index += 1
  ) {
    const char = record[index];
    const nextChar =
      record[index + 1];

    if (
      char === '"' &&
      insideQuotes &&
      nextChar === '"'
    ) {
      index += 1;

      continue;
    }

    if (char === '"') {
      insideQuotes = !insideQuotes;

      continue;
    }

    if (
      !insideQuotes &&
      char === delimiter
    ) {
      count += 1;
    }
  }

  return count;
}