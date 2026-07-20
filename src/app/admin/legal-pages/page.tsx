import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { getCurrentSiteId } from "@/lib/currentSite";
import { LEGAL_PAGE_DEFINITIONS } from "@/lib/legalPages";

export default async function AdminLegalPagesPage() {
  const siteId = await getCurrentSiteId();

  const existingPages = await prisma.legalPage.findMany({
    where: {
      siteId,
    },
    select: {
      type: true,
      published: true,
      updatedAt: true,
      title: true,
    },
  });

  const pagesByType = new Map(
    existingPages.map((page) => [page.type, page]),
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">
          Pages légales et institutionnelles
        </h1>

        <p className="mt-1 text-sm text-slate-600">
          Ces contenus sont propres au site actuellement administré et sont
          séparés des guides, comparatifs et articles SEO.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-slate-500">
              <th className="px-4 py-3 font-medium">Page</th>
              <th className="px-4 py-3 font-medium">Titre</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Dernière modification</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>

          <tbody>
            {LEGAL_PAGE_DEFINITIONS.map((definition) => {
              const existingPage = pagesByType.get(definition.type);

              return (
                <tr
                  key={definition.type}
                  className="border-t border-slate-200"
                >
                  <td className="px-4 py-4">
                    <div className="font-medium text-slate-900">
                      {definition.label}
                    </div>

                    <div className="mt-1 max-w-xl text-xs text-slate-500">
                      {definition.description}
                    </div>
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {existingPage?.title ?? definition.defaultTitle}
                  </td>

                  <td className="px-4 py-4">
                    {!existingPage ? (
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        Non configurée
                      </span>
                    ) : existingPage.published ? (
                      <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        Publiée
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                        Brouillon
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {existingPage
                      ? existingPage.updatedAt.toLocaleDateString("fr-FR")
                      : "—"}
                  </td>

                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {existingPage?.published ? (
                        <Link
                          href={definition.publicPath}
                          target="_blank"
                          className="text-slate-600 underline hover:text-slate-900"
                        >
                          Voir
                        </Link>
                      ) : null}

                      <Link
                        href={`/admin/legal-pages/${definition.adminSlug}`}
                        className="font-medium text-brand-700 underline hover:text-brand-800"
                      >
                        {existingPage ? "Modifier" : "Configurer"}
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}