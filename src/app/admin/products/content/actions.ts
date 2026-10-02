"use server";

import { ProductContentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sanitizeHtml } from "@/lib/sanitize";

type CsvRow = Record<string, string>;

function parseCsv(text: string): CsvRow[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  const input = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];

    if (quoted) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }

  if (quoted) {
    throw new Error("CSV invalide : guillemet non fermé.");
  }

  const nonEmptyRows = rows.filter((values) =>
    values.some((value) => value.trim() !== "")
  );

  if (nonEmptyRows.length === 0) {
    return [];
  }

  const headers = nonEmptyRows[0].map((header) => header.trim());

  return nonEmptyRows.slice(1).map((values) => {
    const result: CsvRow = {};

    headers.forEach((header, index) => {
      result[header] = values[index] ?? "";
    });

    return result;
  });
}

export async function saveProductContent(formData: FormData) {
  const productId = Number(formData.get("productId"));

  if (!Number.isInteger(productId) || productId <= 0) {
    throw new Error("Produit invalide.");
  }

  const metaTitle = String(formData.get("metaTitle") ?? "").trim() || null;
  const metaDescription =
    String(formData.get("metaDescription") ?? "").trim() || null;
  const rawDescription =
    String(formData.get("description") ?? "").trim();

  const description =
    rawDescription ? sanitizeHtml(rawDescription).trim() || null : null;

  const rawStatus = String(formData.get("status") ?? "DRAFT");

  const status =
    rawStatus === "PUBLISHED"
      ? ProductContentStatus.PUBLISHED
      : ProductContentStatus.DRAFT;

  await prisma.productContent.upsert({
    where: { productId },
    create: {
      productId,
      metaTitle,
      metaDescription,
      description,
      status,
    },
    update: {
      metaTitle,
      metaDescription,
      description,
      status,
    },
  });

  revalidatePath("/admin/products/content");
  revalidatePath(`/admin/products/content/${productId}/edit`);

  redirect(`/admin/products/content/${productId}/edit?saved=1`);
}

export async function importProductContentCsv(formData: FormData) {
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    redirect("/admin/products/content?importError=Fichier+CSV+manquant");
  }

  if (!file.name.toLowerCase().endsWith(".csv")) {
    redirect("/admin/products/content?importError=Le+fichier+doit+etre+au+format+CSV");
  }

  let rows: CsvRow[];

  try {
    rows = parseCsv(await file.text());
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "CSV invalide";
    redirect(
      `/admin/products/content?importError=${encodeURIComponent(message)}`
    );
  }

  if (rows.length === 0) {
    redirect("/admin/products/content?importError=Le+fichier+CSV+est+vide");
  }

  const requiredHeaders = [
    "productId",
    "metaTitle",
    "metaDescription",
    "description",
  ];

  const firstRow = rows[0];
  const missingHeaders = requiredHeaders.filter(
    (header) => !(header in firstRow)
  );

  if (missingHeaders.length > 0) {
    redirect(
      `/admin/products/content?importError=${encodeURIComponent(
        `Colonnes manquantes : ${missingHeaders.join(", ")}`
      )}`
    );
  }

  const parsedRows = rows.map((row, index) => ({
    line: index + 2,
    productId: Number(row.productId),
    metaTitle: row.metaTitle?.trim() || null,
    metaDescription: row.metaDescription?.trim() || null,
    description: row.description?.trim()
      ? sanitizeHtml(row.description.trim()).trim() || null
      : null,
    status:
      row.status?.trim().toUpperCase() === "PUBLISHED"
        ? ProductContentStatus.PUBLISHED
        : ProductContentStatus.DRAFT,
  }));

  const validIds = Array.from(
    new Set(
      parsedRows
        .filter(
          (row) =>
            Number.isInteger(row.productId) && row.productId > 0
        )
        .map((row) => row.productId)
    )
  );

  const existingProducts = await prisma.product.findMany({
    where: {
      id: { in: validIds },
    },
    select: {
      id: true,
      content: {
        select: { id: true },
      },
    },
  });

  const existingById = new Map(
    existingProducts.map((product) => [product.id, product])
  );

  let created = 0;
  let updated = 0;
  let ignored = 0;
  let errors = 0;

  for (const row of parsedRows) {
    if (
      !Number.isInteger(row.productId) ||
      row.productId <= 0 ||
      !existingById.has(row.productId)
    ) {
      errors += 1;
      continue;
    }

    if (
      !row.metaTitle &&
      !row.metaDescription &&
      !row.description
    ) {
      ignored += 1;
      continue;
    }

    const alreadyExists = Boolean(
      existingById.get(row.productId)?.content
    );

    try {
      await prisma.productContent.upsert({
        where: {
          productId: row.productId,
        },
        create: {
          productId: row.productId,
          metaTitle: row.metaTitle,
          metaDescription: row.metaDescription,
          description: row.description,
          status: row.status,
        },
        update: {
          metaTitle: row.metaTitle,
          metaDescription: row.metaDescription,
          description: row.description,
          status: row.status,
        },
      });

      if (alreadyExists) {
        updated += 1;
      } else {
        created += 1;
      }
    } catch {
      errors += 1;
    }
  }

  revalidatePath("/admin/products/content");

  const query = new URLSearchParams({
    imported: String(created + updated),
    created: String(created),
    updated: String(updated),
    ignored: String(ignored),
    errors: String(errors),
  });

  redirect(`/admin/products/content?${query.toString()}`);
}
