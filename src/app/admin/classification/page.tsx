// src/app/admin/classification/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentSiteId } from "@/lib/currentSite";

import {
  deleteCategoryEnrichmentRule,
  duplicateCategoryEnrichmentRule,
  toggleCategoryEnrichmentRule,
} from "@/app/actions/category-enrichment";

type PageSearchParams = {
  q?: string | string[];
  active?: string | string[];
  target?: string | string[];
  source?: string | string[];
};

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function AdminClassificationPage({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams>;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== "ADMIN") {
    return notFound();
  }

  const siteId = await getCurrentSiteId();
  const params = (await searchParams) ?? {};

  const q = first(params.q).trim();
  const active = first(params.active).trim();
  const target = first(params.target).trim();
  const source = first(params.source).trim();

  const categories = await prisma.category.findMany({
    where: {
      published: true,
    },
    orderBy: [
      {
        name: "asc",
      },
    ],
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  const categoryBySlug = new Map(
    categories.map((category) => [category.slug, category])
  );

  const where = {
    siteId,

    ...(active === "true"
      ? {
          active: true,
        }
      : active === "false"
        ? {
            active: false,
          }
        : {}),

    ...(target && categoryBySlug.has(target)
      ? {
          targetCategoryId: categoryBySlug.get(target)!.id,
        }
      : {}),

    ...(source && categoryBySlug.has(source)
      ? {
          sourceCategoryId: categoryBySlug.get(source)!.id,
        }
      : {}),

    ...(q
      ? {
          OR: [
            {
              name: {
                contains: q,
                mode: "insensitive" as const,
              },
            },
            {
              includeTerms: {
                has: q,
              },
            },
            {
              excludeTerms: {
                has: q,
              },
            },
          ],
        }
      : {}),
  };

  const [rules, totalActive, totalInactive] = await Promise.all([
    prisma.categoryEnrichmentRule.findMany({
      where,
      orderBy: [
        {
          targetCategory: {
            name: "asc",
          },
        },
        {
          priority: "desc",
        },
        {
          name: "asc",
        },
      ],
      include: {
        sourceCategory: {
          select: {
            name: true,
            slug: true,
          },
        },
        targetCategory: {
          select: {
            name: true,
            slug: true,
          },
        },
        feedSource: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    }),

    prisma.categoryEnrichmentRule.count({
      where: {
        siteId,
        active: true,
      },
    }),

    prisma.categoryEnrichmentRule.count({
      where: {
        siteId,
        active: false,
      },
    }),
  ]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Classification catalogue</h1>
          <p className="mt-1 text-sm text-slate-600">
            Gérez les règles d’enrichissement qui ajoutent des catégories filles
            aux produits importés.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-ring bg-muted/30 px-3 py-1">
              Site : {siteId}
            </span>
            <span className="rounded-full border border-ring bg-muted/30 px-3 py-1">
              Actives : {totalActive}
            </span>
            <span className="rounded-full border border-ring bg-muted/30 px-3 py-1">
              Inactives : {totalInactive}
            </span>
          </div>
        </div>

        <Link
          href="/admin/classification/new"
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm text-white hover:bg-brand-600"
        >
          ➕ Nouvelle règle
        </Link>
      </div>

      <form className="grid grid-cols-1 gap-3 rounded-2xl border border-ring bg-white p-4 md:grid-cols-5">
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-slate-600">Recherche</label>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Nom ou terme exact"
            className="mt-1 w-full rounded-lg border border-ring px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Statut</label>
          <select
            name="active"
            defaultValue={active}
            className="mt-1 w-full rounded-lg border border-ring px-3 py-2 text-sm"
          >
            <option value="">Tous</option>
            <option value="true">Actives</option>
            <option value="false">Inactives</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Source</label>
          <select
            name="source"
            defaultValue={source}
            className="mt-1 w-full rounded-lg border border-ring px-3 py-2 text-sm"
          >
            <option value="">Toutes</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Cible</label>
          <select
            name="target"
            defaultValue={target}
            className="mt-1 w-full rounded-lg border border-ring px-3 py-2 text-sm"
          >
            <option value="">Toutes</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-5 flex flex-wrap gap-2">
          <button
            type="submit"
            className="rounded-lg border border-ring bg-slate-900 px-4 py-2 text-sm text-white"
          >
            Filtrer
          </button>
          <Link
            href="/admin/classification"
            className="rounded-lg border border-ring px-4 py-2 text-sm hover:bg-muted"
          >
            Réinitialiser
          </Link>
        </div>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-ring bg-white">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-muted/60">
            <tr>
              <th className="border-b border-ring px-3 py-2 text-left">Règle</th>
              <th className="border-b border-ring px-3 py-2 text-left">Flux</th>
              <th className="border-b border-ring px-3 py-2 text-left">Source</th>
              <th className="border-b border-ring px-3 py-2 text-left">Cible</th>
              <th className="border-b border-ring px-3 py-2 text-left">Termes</th>
              <th className="border-b border-ring px-3 py-2 text-center">Mode</th>
              <th className="border-b border-ring px-3 py-2 text-right">Priorité</th>
              <th className="border-b border-ring px-3 py-2 text-center">Active</th>
              <th className="border-b border-ring px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {rules.map((rule) => (
              <tr key={rule.id} className="align-top hover:bg-accent/20">
                <td className="border-b border-ring px-3 py-3">
                  <div className="font-medium text-slate-900">{rule.name}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {rule.makePrimary ? "Catégorie principale" : "Catégorie secondaire"}
                    {" · "}
                    recherche :{" "}
                    {[
                      rule.searchTitle ? "titre" : null,
                      rule.searchDescription ? "description" : null,
                      rule.searchCategoryPath ? "catégorie" : null,
                      rule.searchBrand ? "marque" : null,
                    ]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </div>
                </td>

                <td className="border-b border-ring px-3 py-3 text-slate-600">
                  {rule.feedSource?.name ?? "Tous les flux"}
                </td>

                <td className="border-b border-ring px-3 py-3 text-slate-600">
                  {rule.sourceCategory?.name ?? "Toutes"}
                </td>

                <td className="border-b border-ring px-3 py-3 font-medium text-slate-900">
                  {rule.targetCategory.name}
                </td>

                <td className="border-b border-ring px-3 py-3">
                  <div className="max-w-xs text-xs leading-5">
                    <div>
                      <span className="font-semibold text-emerald-700">+</span>{" "}
                      {rule.includeTerms.slice(0, 6).join(", ")}
                      {rule.includeTerms.length > 6 ? "…" : ""}
                    </div>
                    {rule.excludeTerms.length > 0 ? (
                      <div className="mt-1 text-slate-500">
                        <span className="font-semibold text-red-600">-</span>{" "}
                        {rule.excludeTerms.slice(0, 5).join(", ")}
                        {rule.excludeTerms.length > 5 ? "…" : ""}
                      </div>
                    ) : null}
                  </div>
                </td>

                <td className="border-b border-ring px-3 py-3 text-center">
                  {rule.matchMode}
                </td>

                <td className="border-b border-ring px-3 py-3 text-right">
                  {rule.priority}
                </td>

                <td className="border-b border-ring px-3 py-3 text-center">
                  <form action={toggleCategoryEnrichmentRule}>
                    <input type="hidden" name="id" value={rule.id} />
                    <input
                      type="hidden"
                      name="active"
                      value={rule.active ? "false" : "true"}
                    />
                    <button
                      type="submit"
                      className="rounded-full px-2 py-1 hover:bg-muted"
                      title={rule.active ? "Désactiver" : "Activer"}
                    >
                      {rule.active ? "✅" : "❌"}
                    </button>
                  </form>
                </td>

                <td className="border-b border-ring px-3 py-3">
                  <div className="flex flex-col items-end gap-2 whitespace-nowrap">
                    <Link
                      href={`/admin/classification/new?id=${rule.id}`}
                      className="underline"
                    >
                      Modifier
                    </Link>

                    <form action={duplicateCategoryEnrichmentRule}>
                      <input type="hidden" name="id" value={rule.id} />
                      <button type="submit" className="underline">
                        Dupliquer
                      </button>
                    </form>

                    <form action={deleteCategoryEnrichmentRule}>
                      <input type="hidden" name="id" value={rule.id} />
                      <button
                        type="submit"
                        className="text-red-600 underline hover:text-red-700"
                      >
                        Supprimer
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}

            {rules.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-sm text-slate-500">
                  Aucune règle ne correspond aux filtres.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
