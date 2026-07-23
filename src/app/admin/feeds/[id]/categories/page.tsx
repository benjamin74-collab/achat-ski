import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  createCategoryMappingAction,
  updateCategoryMappingAction,
} from "./actions";

export const dynamic = "force-dynamic";

type CategoriesPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function FeedCategoriesPage({
  params,
}: CategoriesPageProps) {
  const { id: rawId } = await params;
  const feedId = Number(rawId);

  if (
    !Number.isInteger(feedId) ||
    feedId <= 0
  ) {
    notFound();
  }

  const [feed, categories] =
    await Promise.all([
      prisma.feedSource.findUnique({
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

          categoryMappings: {
            orderBy: [
              {
                active: "desc",
              },
              {
                priority: "desc",
              },
              {
                externalPath: "asc",
              },
            ],
            select: {
              id: true,
              externalPath: true,
              normalizedExternalPath: true,
              priority: true,
              active: true,
              categoryId: true,

              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
      }),

      prisma.category.findMany({
        orderBy: {
          name: "asc",
        },
        select: {
          id: true,
          name: true,
          slug: true,
          published: true,
        },
      }),
    ]);

  if (!feed) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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
            Catégories
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          Mapping des catégories
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          {feed.affiliateProgram.merchant.name}
          {" · "}
          {feed.categoryMappings.length} mapping(s)
        </p>
      </header>

      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">
          Ajouter un mapping
        </h2>

        <form
          action={createCategoryMappingAction}
          className="mt-5 grid gap-5 lg:grid-cols-[minmax(250px,2fr)_minmax(220px,1fr)_120px_auto]"
        >
          <input
            type="hidden"
            name="feedId"
            value={feed.id}
          />

          <label>
            <span className="text-sm font-medium text-slate-700">
              Chemin externe
            </span>

            <input
              name="externalPath"
              required
              placeholder="Ski > Ski alpin > Skis"
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm"
            />
          </label>

          <CategorySelect
            categories={categories}
          />

          <label>
            <span className="text-sm font-medium text-slate-700">
              Priorité
            </span>

            <input
              type="number"
              name="priority"
              defaultValue="0"
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm"
            />
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              className="inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Ajouter
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        {feed.categoryMappings.map(
          (mapping) => (
            <form
              key={mapping.id}
              action={
                updateCategoryMappingAction
              }
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

              <div className="grid gap-5 lg:grid-cols-[minmax(280px,2fr)_minmax(220px,1fr)_120px_auto]">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Catégorie externe
                  </p>

                  <p className="mt-2 break-words text-sm font-medium text-slate-900">
                    {mapping.externalPath}
                  </p>

                  <p className="mt-1 break-all font-mono text-xs text-slate-500">
                    {
                      mapping.normalizedExternalPath
                    }
                  </p>
                </div>

                <CategorySelect
                  categories={categories}
                  defaultValue={
                    mapping.categoryId
                  }
                />

                <label>
                  <span className="text-sm font-medium text-slate-700">
                    Priorité
                  </span>

                  <input
                    type="number"
                    name="priority"
                    defaultValue={
                      mapping.priority
                    }
                    className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm"
                  />
                </label>

                <div className="flex flex-col justify-end gap-3">
                  <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      name="active"
                      defaultChecked={
                        mapping.active
                      }
                      className="h-4 w-4 rounded border-slate-300"
                    />

                    Actif
                  </label>

                  <button
                    type="submit"
                    className="inline-flex min-h-10 items-center justify-center rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            </form>
          )
        )}

        {feed.categoryMappings.length ===
          0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">
            Aucun mapping de catégorie.
          </div>
        )}
      </section>
    </main>
  );
}

function CategorySelect({
  categories,
  defaultValue,
}: {
  categories: Array<{
    id: number;
    name: string;
    slug: string;
    published: boolean;
  }>;
  defaultValue?: number;
}) {
  return (
    <label>
      <span className="text-sm font-medium text-slate-700">
        Catégorie Meilleur-Ski
      </span>

      <select
        name="categoryId"
        required
        defaultValue={
          defaultValue
            ? String(defaultValue)
            : ""
        }
        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
      >
        <option value="" disabled>
          Sélectionner…
        </option>

        {categories.map((category) => (
          <option
            key={category.id}
            value={category.id}
          >
            {category.name}
            {!category.published
              ? " — non publiée"
              : ""}
          </option>
        ))}
      </select>
    </label>
  );
}