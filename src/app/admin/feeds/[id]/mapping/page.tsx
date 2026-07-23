import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateColumnMappingAction } from "./actions";

export const dynamic = "force-dynamic";

type MappingPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function FeedMappingPage({
  params,
}: MappingPageProps) {
  const { id: rawId } = await params;
  const feedId = Number(rawId);

  if (
    !Number.isInteger(feedId) ||
    feedId <= 0
  ) {
    notFound();
  }

  const feed =
    await prisma.feedSource.findUnique({
      where: {
        id: feedId,
      },
      select: {
        id: true,
        name: true,
        slug: true,

        affiliateProgram: {
          select: {
            merchant: {
              select: {
                name: true,
              },
            },
          },
        },

        columnMappings: {
          orderBy: [
            {
              order: "asc",
            },
            {
              targetField: "asc",
            },
          ],
          select: {
            id: true,
            targetField: true,
            sourceColumn: true,
            fallbackColumns: true,
            required: true,
            defaultValue: true,
            transform: true,
            order: true,
          },
        },
      },
    });

  if (!feed) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <Link
            href="/admin/feeds"
            className="font-medium text-slate-500 hover:text-slate-900"
          >
            Flux
          </Link>

          <span className="text-slate-300">/</span>

          <Link
            href={`/admin/feeds/${feed.id}`}
            className="font-medium text-slate-500 hover:text-slate-900"
          >
            {feed.name}
          </Link>

          <span className="text-slate-300">/</span>

          <span className="text-slate-700">
            Colonnes
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          Mapping des colonnes
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          {feed.affiliateProgram.merchant.name}
          {" · "}
          {feed.name}
          {" · "}
          {feed.columnMappings.length} mapping(s)
        </p>

        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Le champ cible est utilisé par le moteur
          d’import et ne peut pas être renommé depuis
          cette page. Tu peux modifier les colonnes du
          fichier source, les valeurs de secours et les
          transformations.
        </div>
      </header>

      <section className="space-y-5">
        {feed.columnMappings.map((mapping) => (
          <form
            key={mapping.id}
            action={updateColumnMappingAction}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <input
              type="hidden"
              name="feedId"
              value={feed.id}
            />

            <input
              type="hidden"
              name="mappingId"
              value={mapping.id}
            />

            <div className="mb-5 flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Champ cible
                </p>

                <h2 className="mt-1 font-mono text-lg font-semibold text-slate-950">
                  {mapping.targetField}
                </h2>
              </div>

              <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  name="required"
                  defaultChecked={mapping.required}
                  className="h-4 w-4 rounded border-slate-300"
                />

                Champ obligatoire
              </label>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Colonne principale"
                name="sourceColumn"
                defaultValue={mapping.sourceColumn}
                required
              />

              <Field
                label="Transformation"
                name="transform"
                defaultValue={
                  mapping.transform || ""
                }
                placeholder="TEXT, NUMBER, EAN…"
              />

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700">
                  Colonnes de secours
                </label>

                <textarea
                  name="fallbackColumns"
                  defaultValue={mapping.fallbackColumns.join(
                    "\n"
                  )}
                  rows={4}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm shadow-sm outline-none focus:border-slate-500"
                  placeholder={
                    "product name\nname\ntitle"
                  }
                />

                <p className="mt-1 text-xs text-slate-500">
                  Une colonne par ligne. Les virgules
                  et points-virgules sont également
                  acceptés.
                </p>
              </div>

              <Field
                label="Valeur par défaut"
                name="defaultValue"
                defaultValue={
                  mapping.defaultValue || ""
                }
              />

              <Field
                label="Ordre"
                name="order"
                type="number"
                defaultValue={String(mapping.order)}
              />
            </div>

            <div className="mt-5 flex justify-end border-t border-slate-200 pt-4">
              <button
                type="submit"
                className="inline-flex min-h-10 items-center justify-center rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Enregistrer ce mapping
              </button>
            </div>
          </form>
        ))}
      </section>
    </main>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  defaultValue: string;
  placeholder?: string;
  type?: "text" | "number";
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">
        {label}
      </span>

      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-500"
      />
    </label>
  );
}