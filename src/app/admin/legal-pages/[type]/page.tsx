import Link from "next/link";
import { notFound } from "next/navigation";

import RichTextEditor from "@/components/admin/RichTextEditor";
import { saveLegalPageAction } from "@/app/actions/legalPages";
import { prisma } from "@/lib/prisma";
import { getCurrentSiteId } from "@/lib/currentSite";
import { getLegalPageDefinitionByAdminSlug } from "@/lib/legalPages";

type AdminLegalPageEditProps = {
  params: Promise<{
    type: string;
  }>;
};

export default async function AdminLegalPageEdit({
  params,
}: AdminLegalPageEditProps) {
  const { type: adminSlug } = await params;

  const definition = getLegalPageDefinitionByAdminSlug(adminSlug);

  if (!definition) {
    notFound();
  }

  const siteId = await getCurrentSiteId();

  const legalPage = await prisma.legalPage.findUnique({
    where: {
      siteId_type: {
        siteId,
        type: definition.type,
      },
    },
  });

  const effectiveDateValue = legalPage?.effectiveDate
    ? legalPage.effectiveDate.toISOString().slice(0, 10)
    : "";

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <Link
          href="/admin/legal-pages"
          className="text-sm text-slate-600 underline hover:text-slate-900"
        >
          ← Retour aux pages légales
        </Link>

        <h1 className="mt-3 text-xl font-semibold text-slate-900">
          {definition.label}
        </h1>

        <p className="mt-1 text-sm text-slate-600">
          {definition.description}
        </p>
      </div>

      <form
        action={saveLegalPageAction}
        className="space-y-6 rounded-xl border border-slate-200 bg-white p-6"
      >
        <input type="hidden" name="type" value={definition.type} />

        <div className="grid gap-2">
          <label
            htmlFor="title"
            className="text-sm font-medium text-slate-700"
          >
            Titre de la page
          </label>

          <input
            id="title"
            name="title"
            type="text"
            required
            defaultValue={legalPage?.title ?? definition.defaultTitle}
            className="input"
          />
        </div>

        <RichTextEditor
          name="content"
          label="Contenu"
          rows={24}
          initialValue={legalPage?.content ?? ""}
        />

        <div className="grid gap-5 md:grid-cols-2">
          <div className="grid gap-2">
            <label
              htmlFor="version"
              className="text-sm font-medium text-slate-700"
            >
              Version
            </label>

            <input
              id="version"
              name="version"
              type="text"
              defaultValue={legalPage?.version ?? ""}
              placeholder="Exemple : 1.0"
              className="input"
            />

            <p className="text-xs text-slate-500">
              Facultatif, principalement utile pour les CGU et les politiques.
            </p>
          </div>

          <div className="grid gap-2">
            <label
              htmlFor="effectiveDate"
              className="text-sm font-medium text-slate-700"
            >
              Date d’entrée en vigueur
            </label>

            <input
              id="effectiveDate"
              name="effectiveDate"
              type="date"
              defaultValue={effectiveDateValue}
              className="input"
            />
          </div>
        </div>

        <div className="border-t border-slate-200 pt-6">
          <h2 className="text-base font-semibold text-slate-900">
            Référencement
          </h2>

          <div className="mt-4 space-y-5">
            <div className="grid gap-2">
              <label
                htmlFor="metaTitle"
                className="text-sm font-medium text-slate-700"
              >
                Méta-title
              </label>

              <input
                id="metaTitle"
                name="metaTitle"
                type="text"
                defaultValue={legalPage?.metaTitle ?? ""}
                placeholder={definition.defaultTitle}
                className="input"
              />
            </div>

            <div className="grid gap-2">
              <label
                htmlFor="metaDescription"
                className="text-sm font-medium text-slate-700"
              >
                Méta-description
              </label>

              <textarea
                id="metaDescription"
                name="metaDescription"
                rows={3}
                defaultValue={legalPage?.metaDescription ?? ""}
                className="input"
              />
            </div>
          </div>
        </div>

        <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <input
            name="published"
            type="checkbox"
            defaultChecked={legalPage?.published ?? false}
            className="mt-1 h-4 w-4"
          />

          <span>
            <span className="block text-sm font-medium text-slate-900">
              Publier cette page
            </span>

            <span className="mt-1 block text-xs text-slate-500">
              Une page non publiée ne sera pas accessible sur le site public.
            </span>
          </span>
        </label>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-6">
          <Link href="/admin/legal-pages" className="btn-outline">
            Annuler
          </Link>

          <button type="submit" className="btn">
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}