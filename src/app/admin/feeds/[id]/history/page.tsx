import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type HistoryPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function FeedHistoryPage({
  params,
}: HistoryPageProps) {
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

        imports: {
          orderBy: {
            startedAt: "desc",
          },
          take: 100,
          select: {
            id: true,
            trigger: true,
            status: true,
            statusV2: true,

            totalRows: true,
            importedRows: true,
            skippedRows: true,

            createdProducts: true,
            updatedProducts: true,
            unchangedProducts: true,
            restoredProducts: true,

            createdOffers: true,
            updatedOffers: true,
            unchangedOffers: true,
            restoredOffers: true,

            deactivatedProducts: true,
            deactivatedOffers: true,

            errorsCount: true,
            warningsCount: true,

            errorMessage: true,
            notes: true,

            startedAt: true,
            finishedAt: true,
            durationMs: true,
          },
        },
      },
    });

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
            Historique
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          Historique des imports
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Les {feed.imports.length} dernières
          exécutions enregistrées.
        </p>
      </header>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {feed.imports.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <Header>Date</Header>
                  <Header>Statut</Header>
                  <Header>Durée</Header>
                  <Header>Lignes</Header>
                  <Header>Produits</Header>
                  <Header>Offres</Header>
                  <Header>Désactivations</Header>
                  <Header>Qualité</Header>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {feed.imports.map(
                  (feedImport) => {
                    const products =
                      feedImport.createdProducts +
                      feedImport.updatedProducts +
                      feedImport.unchangedProducts +
                      feedImport.restoredProducts;

                    const offers =
                      feedImport.createdOffers +
                      feedImport.updatedOffers +
                      feedImport.unchangedOffers +
                      feedImport.restoredOffers;

                    return (
                      <tr
                        key={feedImport.id}
                        className="align-top hover:bg-slate-50"
                      >
                        <Cell>
                          <p className="whitespace-nowrap font-medium text-slate-900">
                            {formatDate(
                              feedImport.startedAt
                            )}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            #{feedImport.id}
                            {" · "}
                            {String(
                              feedImport.trigger
                            )}
                          </p>
                        </Cell>

                        <Cell>
                          <StatusBadge
                            status={
                              feedImport.statusV2 ||
                              feedImport.status
                            }
                          />
                        </Cell>

                        <Cell>
                          {formatDuration(
                            feedImport.durationMs
                          )}
                        </Cell>

                        <Cell>
                          <strong>
                            {feedImport.importedRows.toLocaleString(
                              "fr-FR"
                            )}
                          </strong>

                          <p className="mt-1 text-xs text-slate-500">
                            sur{" "}
                            {feedImport.totalRows.toLocaleString(
                              "fr-FR"
                            )}
                          </p>
                        </Cell>

                        <Cell>
                          <strong>
                            {products.toLocaleString(
                              "fr-FR"
                            )}
                          </strong>

                          <p className="mt-1 text-xs text-slate-500">
                            {
                              feedImport.createdProducts
                            }{" "}
                            créés
                          </p>
                        </Cell>

                        <Cell>
                          <strong>
                            {offers.toLocaleString(
                              "fr-FR"
                            )}
                          </strong>

                          <p className="mt-1 text-xs text-slate-500">
                            {
                              feedImport.createdOffers
                            }{" "}
                            créées
                          </p>
                        </Cell>

                        <Cell>
                          <p>
                            {
                              feedImport.deactivatedProducts
                            }{" "}
                            produit(s)
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {
                              feedImport.deactivatedOffers
                            }{" "}
                            offre(s)
                          </p>
                        </Cell>

                        <Cell>
                          <p
                            className={
                              feedImport.errorsCount >
                              0
                                ? "font-semibold text-red-700"
                                : ""
                            }
                          >
                            {
                              feedImport.errorsCount
                            }{" "}
                            erreur(s)
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {
                              feedImport.warningsCount
                            }{" "}
                            avertissement(s)
                          </p>

                          {feedImport.errorMessage && (
                            <details className="mt-2 max-w-xs">
                              <summary className="cursor-pointer text-xs font-medium text-red-700">
                                Voir l’erreur
                              </summary>

                              <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-red-700">
                                {
                                  feedImport.errorMessage
                                }
                              </p>
                            </details>
                          )}
                        </Cell>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-16 text-center text-sm text-slate-500">
            Aucun import enregistré.
          </div>
        )}
      </section>
    </main>
  );
}

function Header({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

function Cell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <td className="px-4 py-4 text-sm text-slate-700">
      {children}
    </td>
  );
}

function StatusBadge({
  status,
}: {
  status: string | null | undefined;
}) {
  const normalized =
    status?.toUpperCase() || "UNKNOWN";

  let classes =
    "bg-slate-100 text-slate-700 ring-slate-200";

  if (
    ["SUCCESS", "COMPLETED", "DONE"].includes(
      normalized
    )
  ) {
    classes =
      "bg-emerald-100 text-emerald-800 ring-emerald-200";
  } else if (normalized === "PARTIAL") {
    classes =
      "bg-amber-100 text-amber-800 ring-amber-200";
  } else if (
    ["FAILED", "ERROR"].includes(normalized)
  ) {
    classes =
      "bg-red-100 text-red-800 ring-red-200";
  } else if (
    ["RUNNING", "PROCESSING"].includes(
      normalized
    )
  ) {
    classes =
      "bg-blue-100 text-blue-800 ring-blue-200";
  }

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${classes}`}
    >
      {formatStatus(normalized)}
    </span>
  );
}

function formatStatus(status: string): string {
  switch (status) {
    case "SUCCESS":
    case "COMPLETED":
    case "DONE":
      return "Réussi";

    case "PARTIAL":
      return "Partiel";

    case "FAILED":
    case "ERROR":
      return "Échec";

    case "RUNNING":
    case "PROCESSING":
      return "En cours";

    case "PENDING":
      return "En attente";

    default:
      return status;
  }
}

function formatDate(
  value: Date | null | undefined
): string {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(value);
}

function formatDuration(
  value: number | null | undefined
): string {
  if (!value || value <= 0) {
    return "—";
  }

  const seconds = Math.round(value / 1000);

  if (seconds < 60) {
    return `${seconds} s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes} min ${remainingSeconds} s`;
}