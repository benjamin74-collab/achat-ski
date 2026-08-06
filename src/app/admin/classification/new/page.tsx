// src/app/admin/classification/new/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";

import { upsertCategoryEnrichmentRule } from "@/app/actions/category-enrichment";
import { authOptions } from "@/lib/auth";
import { getCurrentSiteId } from "@/lib/currentSite";
import { prisma } from "@/lib/prisma";

type PageSearchParams = {
  id?: string | string[];
};

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function toTextArea(values: string[] | undefined): string {
  return (values ?? []).join("\n");
}

export default async function AdminClassificationRuleFormPage({
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
  const id = Number(first(params.id));

  const [categories, feedSources, existingRule] = await Promise.all([
    prisma.category.findMany({
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
        parent: {
          select: {
            name: true,
          },
        },
      },
    }),

    prisma.feedSource.findMany({
      where: {
        siteId,
        active: true,
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
    }),

    Number.isInteger(id) && id > 0
      ? prisma.categoryEnrichmentRule.findUnique({
          where: {
            id,
          },
        })
      : Promise.resolve(null),
  ]);

  if (Number.isInteger(id) && id > 0 && !existingRule) {
    return notFound();
  }

  if (existingRule && existingRule.siteId !== siteId) {
    return notFound();
  }

  const isEdit = Boolean(existingRule);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {isEdit ? "Modifier la règle" : "Nouvelle règle de classification"}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Site : {siteId}
          </p>
        </div>

        <Link
          href="/admin/classification"
          className="rounded-lg border border-ring px-4 py-2 text-sm hover:bg-muted"
        >
          ← Retour aux règles
        </Link>
      </div>

      <form
        action={upsertCategoryEnrichmentRule}
        className="space-y-6 rounded-2xl border border-ring bg-white p-5"
      >
        <input type="hidden" name="id" value={existingRule?.id ?? ""} />
        <input type="hidden" name="siteId" value={siteId} />

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700">
              Nom de la règle
            </label>
            <input
              name="name"
              required
              minLength={3}
              defaultValue={existingRule?.name ?? ""}
              placeholder="Ex : Skis piste — Rossignol Hero"
              className="mt-1 w-full rounded-lg border border-ring px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Flux concerné
            </label>
            <select
              name="feedSourceId"
              defaultValue={existingRule?.feedSourceId ?? ""}
              className="mt-1 w-full rounded-lg border border-ring px-3 py-2 text-sm"
            >
              <option value="">Tous les flux du site</option>
              {feedSources.map((feedSource) => (
                <option key={feedSource.id} value={feedSource.id}>
                  {feedSource.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Mode de correspondance
            </label>
            <select
              name="matchMode"
              defaultValue={existingRule?.matchMode ?? "ANY"}
              className="mt-1 w-full rounded-lg border border-ring px-3 py-2 text-sm"
            >
              <option value="ANY">ANY — au moins un terme</option>
              <option value="ALL">ALL — tous les termes</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Catégorie source
            </label>
            <select
              name="sourceCategoryId"
              defaultValue={existingRule?.sourceCategoryId ?? ""}
              className="mt-1 w-full rounded-lg border border-ring px-3 py-2 text-sm"
            >
              <option value="">Toutes les catégories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.parent?.name ? `${category.parent.name} > ` : ""}
                  {category.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              La règle ne s’applique que si le produit est déjà dans cette catégorie.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Catégorie cible
            </label>
            <select
              name="targetCategoryId"
              required
              defaultValue={existingRule?.targetCategoryId ?? ""}
              className="mt-1 w-full rounded-lg border border-ring px-3 py-2 text-sm"
            >
              <option value="">Choisir une catégorie</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.parent?.name ? `${category.parent.name} > ` : ""}
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-700">
              Termes d’inclusion
            </label>
            <textarea
              name="includeTerms"
              required
              rows={10}
              defaultValue={toTextArea(existingRule?.includeTerms)}
              placeholder={"hero\nredster\ns/max"}
              className="mt-1 w-full rounded-lg border border-ring px-3 py-2 font-mono text-sm"
            />
            <p className="mt-1 text-xs text-slate-500">
              Un terme par ligne. Les virgules sont aussi acceptées.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Termes d’exclusion
            </label>
            <textarea
              name="excludeTerms"
              rows={10}
              defaultValue={toTextArea(existingRule?.excludeTerms)}
              placeholder={"junior\nfreeride\nrandonnee"}
              className="mt-1 w-full rounded-lg border border-ring px-3 py-2 font-mono text-sm"
            />
            <p className="mt-1 text-xs text-slate-500">
              Si un de ces termes est trouvé, la règle ne s’applique pas.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 rounded-2xl border border-ring bg-muted/20 p-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-700">
              Priorité
            </label>
            <input
              type="number"
              name="priority"
              defaultValue={existingRule?.priority ?? 0}
              className="mt-1 w-full rounded-lg border border-ring px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-slate-500">
              Plus le nombre est élevé, plus la règle est prioritaire.
            </p>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium text-slate-700">
              Options
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="active"
                defaultChecked={existingRule?.active ?? true}
              />
              Règle active
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="makePrimary"
                defaultChecked={existingRule?.makePrimary ?? true}
              />
              La catégorie cible devient principale
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-ring bg-muted/20 p-4">
          <div className="text-sm font-medium text-slate-700">
            Champs analysés
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="searchTitle"
                defaultChecked={existingRule?.searchTitle ?? true}
              />
              Titre / nom
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="searchDescription"
                defaultChecked={existingRule?.searchDescription ?? true}
              />
              Description
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="searchCategoryPath"
                defaultChecked={existingRule?.searchCategoryPath ?? true}
              />
              Catégorie marchand
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="searchBrand"
                defaultChecked={existingRule?.searchBrand ?? false}
              />
              Marque
            </label>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            {isEdit ? "Enregistrer les modifications" : "Créer la règle"}
          </button>

          <Link
            href="/admin/classification"
            className="rounded-lg border border-ring px-5 py-2 text-sm hover:bg-muted"
          >
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}
