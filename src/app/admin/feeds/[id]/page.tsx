import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import FeedImportButton from "@/components/admin/FeedImportButton";
import DeleteFeedSourceButton from "@/components/admin/DeleteFeedSourceButton";

export const dynamic = "force-dynamic";

type AdminFeedPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(value: Date | null | undefined): string {
  if (!value) {
    return "Jamais";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(value);
}

function formatDuration(durationMs: number | null | undefined): string {
  if (!durationMs || durationMs <= 0) {
    return "—";
  }

  if (durationMs < 1_000) {
    return `${durationMs} ms`;
  }

  const totalSeconds = Math.round(durationMs / 1_000);

  if (totalSeconds < 60) {
    return `${totalSeconds} s`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes < 60) {
    return seconds > 0 ? `${minutes} min ${seconds} s` : `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours} h ${remainingMinutes} min`;
}

function getStatus(
  statusV2: string | null | undefined,
  legacyStatus: string | null | undefined
): string {
  return (statusV2 || legacyStatus || "").trim().toUpperCase();
}

function getStatusLabel(
  statusV2: string | null | undefined,
  legacyStatus: string | null | undefined
): string {
  const status = getStatus(statusV2, legacyStatus);

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

    case "CANCELLED":
    case "CANCELED":
      return "Annulé";

    default:
      return status || "Inconnu";
  }
}

function getStatusClasses(
  statusV2: string | null | undefined,
  legacyStatus: string | null | undefined
): string {
  const status = getStatus(statusV2, legacyStatus);

  switch (status) {
    case "SUCCESS":
    case "COMPLETED":
    case "DONE":
      return "bg-emerald-100 text-emerald-800 ring-emerald-200";

    case "PARTIAL":
      return "bg-amber-100 text-amber-800 ring-amber-200";

    case "FAILED":
    case "ERROR":
      return "bg-red-100 text-red-800 ring-red-200";

    case "RUNNING":
    case "PROCESSING":
      return "bg-blue-100 text-blue-800 ring-blue-200";

    case "PENDING":
      return "bg-slate-100 text-slate-700 ring-slate-200";

    case "CANCELLED":
    case "CANCELED":
      return "bg-violet-100 text-violet-800 ring-violet-200";

    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

function formatFrequency(value: string): string {
  switch (value.toUpperCase()) {
    case "HOURLY":
      return "Toutes les heures";

    case "DAILY":
      return "Tous les jours";

    case "WEEKLY":
      return "Toutes les semaines";

    case "MONTHLY":
      return "Tous les mois";

    case "MANUAL":
      return "Manuel";

    default:
      return value;
  }
}

export default async function AdminFeedPage({
  params,
}: AdminFeedPageProps) {
  const { id: rawId } = await params;
  const feedId = Number(rawId);

  if (!Number.isInteger(feedId) || feedId <= 0) {
    notFound();
  }

  const feed = await prisma.feedSource.findUnique({
    where: {
      id: feedId,
    },

    select: {
      id: true,
      siteId: true,
      name: true,
      slug: true,

      sourceUrl: true,

      format: true,
      delimiter: true,
      encoding: true,

      active: true,
      autoImport: true,

      frequency: true,
      timezone: true,

      lastRunAt: true,
      nextRunAt: true,
      lastSuccessAt: true,
      lastFailureAt: true,
      lastStatus: true,
      lastErrorMessage: true,

      createdAt: true,
      updatedAt: true,

      affiliateProgram: {
        select: {
          id: true,
          name: true,
          active: true,

          merchant: {
            select: {
              id: true,
              name: true,
              slug: true,
              websiteUrl: true,
              platform: true,
              network: true,
              active: true,
            },
          },

          network: {
            select: {
              id: true,
              name: true,
              slug: true,
              websiteUrl: true,
              active: true,
            },
          },
        },
      },

      columnMappings: {
        orderBy: {
          order: "asc",
        },

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

      categoryMappings: {
        where: {
          active: true,
        },

        orderBy: [
          {
            priority: "desc",
          },
          {
            normalizedExternalPath: "asc",
          },
        ],

        select: {
          id: true,
          externalPath: true,
          normalizedExternalPath: true,
          priority: true,

          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },

      imports: {
        orderBy: {
          startedAt: "desc",
        },

        take: 20,

        select: {
          id: true,
          trigger: true,

          status: true,
          statusV2: true,

          filename: true,
          feedKey: true,

          totalRows: true,
          importedRows: true,

          createdProducts: true,
          updatedProducts: true,
          unchangedProducts: true,
          restoredProducts: true,

          createdSkus: true,
          updatedSkus: true,

          createdOffers: true,
          updatedOffers: true,
          unchangedOffers: true,
          restoredOffers: true,

          skippedRows: true,
          deactivatedOffers: true,
          deactivatedProducts: true,
          deletedProducts: true,

          errorsCount: true,
          warningsCount: true,

          notes: true,
          errorMessage: true,

          startedAt: true,
          finishedAt: true,
          durationMs: true,
        },
      },

      _count: {
        select: {
          columnMappings: true,
          categoryMappings: true,
          imports: true,
          offers: true,
        },
      },
    },
  });

  if (!feed) {
    notFound();
  }

  const lastImport = feed.imports[0];

  const displayedStatusV2 = lastImport?.statusV2 || feed.lastStatus;
  const displayedLegacyStatus = lastImport?.status;

  const lastError =
    lastImport?.errorMessage || feed.lastErrorMessage || null;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <Link
            href="/admin"
            className="font-medium text-slate-500 transition hover:text-slate-900"
          >
            Administration
          </Link>

          <span className="text-slate-300">/</span>

          <Link
            href="/admin/feeds"
            className="font-medium text-slate-500 transition hover:text-slate-900"
          >
            Flux d’affiliation
          </Link>

          <span className="text-slate-300">/</span>

          <span className="text-slate-700">{feed.name}</span>
        </div>

        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight text-slate-950">
                {feed.name}
              </h1>

              <span
                className={[
                  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
                  feed.active
                    ? "bg-emerald-100 text-emerald-800 ring-emerald-200"
                    : "bg-slate-100 text-slate-600 ring-slate-200",
                ].join(" ")}
              >
                {feed.active ? "Actif" : "Inactif"}
              </span>

              {feed.autoImport && (
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800 ring-1 ring-inset ring-blue-200">
                  Import automatique
                </span>
              )}

              <span
                className={[
                  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
                  getStatusClasses(
                    displayedStatusV2,
                    displayedLegacyStatus
                  ),
                ].join(" ")}
              >
                {getStatusLabel(
                  displayedStatusV2,
                  displayedLegacyStatus
                )}
              </span>
            </div>

            <p className="mt-3 text-sm text-slate-600">
              {feed.affiliateProgram.merchant.name}
              {" · "}
              {feed.affiliateProgram.network.name}
              {" · "}
              {feed.siteId}
            </p>

            <p className="mt-2 font-mono text-xs text-slate-500">
              {feed.slug} · flux #{feed.id}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
		    <FeedImportButton
			  feedId={feed.id}
			  disabled={!feed.active}
			/>
			
			<Link
			  href={`/admin/feeds/${feed.id}/edit`}
			  className="inline-flex min-h-10 items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
			>
			  Modifier le flux
		  </Link>

			<DeleteFeedSourceButton
			  feedId={feed.id}
			  feedName={feed.name}
			/>
			
            <Link
              href={`/admin/feeds/${feed.id}/mapping`}
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Mapping des colonnes
            </Link>

            <Link
              href={`/admin/feeds/${feed.id}/categories`}
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Mapping des catégories
            </Link>

            <Link
              href="/admin/feeds"
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Retour aux flux
            </Link>
          </div>
        </div>
      </header>

      <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Imports enregistrés"
          value={feed._count.imports}
          description="Historique complet"
        />

        <SummaryCard
          label="Offres liées"
          value={feed._count.offers}
          description="Offres rattachées au flux"
        />

        <SummaryCard
          label="Mappings de colonnes"
          value={feed._count.columnMappings}
          description="Champs du normaliseur"
        />

        <SummaryCard
          label="Mappings catégories"
          value={feed._count.categoryMappings}
          description="Mappings actifs et inactifs"
        />
      </section>

      {lastError && (
        <section className="mb-8 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-sm font-semibold text-red-900">
            Dernière erreur détectée
          </p>

          <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-red-800">
            {lastError}
          </p>
        </section>
      )}

      <div className="grid gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <div className="space-y-8">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-950">
                Dernier import
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Résultat de la dernière exécution enregistrée.
              </p>
            </div>

            {lastImport ? (
              <>
                <div className="grid gap-px bg-slate-200 sm:grid-cols-2 xl:grid-cols-4">
                  <Metric
                    label="Lignes lues"
                    value={lastImport.totalRows}
                    secondary={`${lastImport.skippedRows.toLocaleString(
                      "fr-FR"
                    )} ignorée(s)`}
                  />

                  <Metric
                    label="Lignes importées"
                    value={lastImport.importedRows}
                    secondary={`${lastImport.errorsCount.toLocaleString(
                      "fr-FR"
                    )} erreur(s)`}
                  />

                  <Metric
                    label="Produits traités"
                    value={
                      lastImport.createdProducts +
                      lastImport.updatedProducts +
                      lastImport.unchangedProducts +
                      lastImport.restoredProducts
                    }
                    secondary={`${lastImport.createdProducts} créé(s), ${lastImport.updatedProducts} modifié(s)`}
                  />

                  <Metric
                    label="Offres traitées"
                    value={
                      lastImport.createdOffers +
                      lastImport.updatedOffers +
                      lastImport.unchangedOffers +
                      lastImport.restoredOffers
                    }
                    secondary={`${lastImport.createdOffers} créée(s), ${lastImport.updatedOffers} modifiée(s)`}
                  />
                </div>

                <div className="grid gap-6 px-5 py-5 sm:grid-cols-2 xl:grid-cols-3">
                  <DefinitionList
                    title="Exécution"
                    rows={[
                      {
                        label: "Statut",
                        value: getStatusLabel(
                          lastImport.statusV2,
                          lastImport.status
                        ),
                      },
                      {
                        label: "Déclenchement",
                        value: String(lastImport.trigger),
                      },
                      {
                        label: "Démarré le",
                        value: formatDate(lastImport.startedAt),
                      },
                      {
                        label: "Terminé le",
                        value: formatDate(lastImport.finishedAt),
                      },
                      {
                        label: "Durée",
                        value: formatDuration(lastImport.durationMs),
                      },
                    ]}
                  />

                  <DefinitionList
                    title="Produits et variantes"
                    rows={[
                      {
                        label: "Produits créés",
                        value: lastImport.createdProducts.toLocaleString(
                          "fr-FR"
                        ),
                      },
                      {
                        label: "Produits mis à jour",
                        value: lastImport.updatedProducts.toLocaleString(
                          "fr-FR"
                        ),
                      },
                      {
                        label: "Produits inchangés",
                        value: lastImport.unchangedProducts.toLocaleString(
                          "fr-FR"
                        ),
                      },
                      {
                        label: "Produits restaurés",
                        value: lastImport.restoredProducts.toLocaleString(
                          "fr-FR"
                        ),
                      },
                      {
                        label: "SKU créés",
                        value: lastImport.createdSkus.toLocaleString("fr-FR"),
                      },
                      {
                        label: "SKU mis à jour",
                        value: lastImport.updatedSkus.toLocaleString("fr-FR"),
                      },
                    ]}
                  />

                  <DefinitionList
                    title="Qualité et désactivation"
                    rows={[
                      {
                        label: "Avertissements",
                        value: lastImport.warningsCount.toLocaleString(
                          "fr-FR"
                        ),
                      },
                      {
                        label: "Erreurs",
                        value: lastImport.errorsCount.toLocaleString("fr-FR"),
                      },
                      {
                        label: "Offres désactivées",
                        value: lastImport.deactivatedOffers.toLocaleString(
                          "fr-FR"
                        ),
                      },
                      {
                        label: "Produits désactivés",
                        value: lastImport.deactivatedProducts.toLocaleString(
                          "fr-FR"
                        ),
                      },
                      {
                        label: "Produits supprimés",
                        value: lastImport.deletedProducts.toLocaleString(
                          "fr-FR"
                        ),
                      },
                    ]}
                  />
                </div>

                {(lastImport.notes || lastImport.errorMessage) && (
                  <div className="border-t border-slate-200 px-5 py-4">
                    {lastImport.notes && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Notes
                        </p>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                          {lastImport.notes}
                        </p>
                      </div>
                    )}

                    {lastImport.errorMessage && (
                      <div className={lastImport.notes ? "mt-5" : ""}>
                        <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                          Message d’erreur
                        </p>

                        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-red-800">
                          {lastImport.errorMessage}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <EmptyState message="Aucun import n’a encore été enregistré pour ce flux." />
            )}
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Historique des imports
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Les 20 exécutions les plus récentes.
                </p>
              </div>

              <Link
                href={`/admin/feeds/${feed.id}/history`}
                className="text-sm font-semibold text-slate-700 transition hover:text-slate-950"
              >
                Voir l’historique complet
              </Link>
            </div>

            {feed.imports.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <TableHeader>Date</TableHeader>
                      <TableHeader>Statut</TableHeader>
                      <TableHeader>Durée</TableHeader>
                      <TableHeader>Lignes</TableHeader>
                      <TableHeader>Produits</TableHeader>
                      <TableHeader>Offres</TableHeader>
                      <TableHeader>Erreurs</TableHeader>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200 bg-white">
                    {feed.imports.map((feedImport) => {
                      const products =
                        feedImport.createdProducts +
                        feedImport.updatedProducts;

                      const offers =
                        feedImport.createdOffers + feedImport.updatedOffers;

                      return (
                        <tr
                          key={feedImport.id}
                          className="transition hover:bg-slate-50"
                        >
                          <TableCell>
                            <div className="whitespace-nowrap font-medium text-slate-900">
                              {formatDate(feedImport.startedAt)}
                            </div>

                            <div className="mt-1 text-xs text-slate-500">
                              #{feedImport.id} · {String(feedImport.trigger)}
                            </div>
                          </TableCell>

                          <TableCell>
                            <span
                              className={[
                                "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
                                getStatusClasses(
                                  feedImport.statusV2,
                                  feedImport.status
                                ),
                              ].join(" ")}
                            >
                              {getStatusLabel(
                                feedImport.statusV2,
                                feedImport.status
                              )}
                            </span>
                          </TableCell>

                          <TableCell>
                            {formatDuration(feedImport.durationMs)}
                          </TableCell>

                          <TableCell>
                            <div className="font-medium text-slate-900">
                              {feedImport.importedRows.toLocaleString("fr-FR")}
                            </div>

                            <div className="mt-1 text-xs text-slate-500">
                              sur{" "}
                              {feedImport.totalRows.toLocaleString("fr-FR")}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="font-medium text-slate-900">
                              {products.toLocaleString("fr-FR")}
                            </div>

                            <div className="mt-1 text-xs text-slate-500">
                              {feedImport.createdProducts} créés
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="font-medium text-slate-900">
                              {offers.toLocaleString("fr-FR")}
                            </div>

                            <div className="mt-1 text-xs text-slate-500">
                              {feedImport.createdOffers} créées
                            </div>
                          </TableCell>

                          <TableCell>
                            <div
                              className={
                                feedImport.errorsCount > 0
                                  ? "font-semibold text-red-700"
                                  : "font-medium text-slate-900"
                              }
                            >
                              {feedImport.errorsCount.toLocaleString("fr-FR")}
                            </div>

                            <div className="mt-1 text-xs text-slate-500">
                              {feedImport.warningsCount} avertissement(s)
                            </div>
                          </TableCell>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState message="L’historique de ce flux est vide." />
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Configuration du flux
            </h2>

            <dl className="mt-5 space-y-3 text-sm">
              <DefinitionRow label="Format" value={String(feed.format)} />

              <DefinitionRow
                label="Séparateur"
                value={
                  feed.delimiter === "\t"
                    ? "Tabulation"
                    : feed.delimiter || "Détection automatique"
                }
              />

              <DefinitionRow
                label="Encodage"
                value={feed.encoding || "Non renseigné"}
              />

              <DefinitionRow
                label="Fréquence"
                value={formatFrequency(String(feed.frequency))}
              />

              <DefinitionRow
                label="Fuseau horaire"
                value={feed.timezone || "Europe/Paris"}
              />

              <DefinitionRow
                label="Import automatique"
                value={feed.autoImport ? "Oui" : "Non"}
              />

              <DefinitionRow
                label="Prochaine exécution"
                value={formatDate(feed.nextRunAt)}
              />
            </dl>

            <div className="mt-5 border-t border-slate-200 pt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                URL source
              </p>

              <p className="mt-2 break-all font-mono text-xs leading-5 text-slate-600">
                {feed.sourceUrl || "Aucune URL renseignée"}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Marchand et réseau
            </h2>

            <dl className="mt-5 space-y-3 text-sm">
              <DefinitionRow
                label="Marchand"
                value={feed.affiliateProgram.merchant.name}
              />

              <DefinitionRow
                label="Plateforme"
                value={String(feed.affiliateProgram.merchant.platform)}
              />

              <DefinitionRow
                label="Ancien réseau"
                value={feed.affiliateProgram.merchant.network || "—"}
              />

              <DefinitionRow
                label="Réseau"
                value={feed.affiliateProgram.network.name}
              />

              <DefinitionRow
				label="Programme"
				value={
				feed.affiliateProgram.name ||
				"Programme sans nom"
				 }
			  />

              <DefinitionRow
                label="Programme actif"
                value={feed.affiliateProgram.active ? "Oui" : "Non"}
              />

              <DefinitionRow label="Site" value={feed.siteId} />
            </dl>

            {(feed.affiliateProgram.merchant.websiteUrl ||
              feed.affiliateProgram.network.websiteUrl) && (
              <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-200 pt-5">
                {feed.affiliateProgram.merchant.websiteUrl && (
                  <a
                    href={feed.affiliateProgram.merchant.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-9 items-center rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Site du marchand
                  </a>
                )}

                {feed.affiliateProgram.network.websiteUrl && (
                  <a
                    href={feed.affiliateProgram.network.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-9 items-center rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Site du réseau
                  </a>
                )}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Dernières exécutions
            </h2>

            <dl className="mt-5 space-y-3 text-sm">
              <DefinitionRow
                label="Dernière exécution"
                value={formatDate(feed.lastRunAt)}
              />

              <DefinitionRow
                label="Dernier succès"
                value={formatDate(feed.lastSuccessAt)}
              />

              <DefinitionRow
                label="Dernier échec"
                value={formatDate(feed.lastFailureAt)}
              />

              <DefinitionRow
                label="Créé le"
                value={formatDate(feed.createdAt)}
              />

              <DefinitionRow
                label="Mis à jour le"
                value={formatDate(feed.updatedAt)}
              />
            </dl>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Aperçu des mappings
            </h2>

            <div className="mt-5">
              <p className="text-sm font-medium text-slate-800">
                Colonnes
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {feed.columnMappings.slice(0, 10).map((mapping) => (
                  <span
                    key={mapping.id}
                    title={`${mapping.sourceColumn} → ${mapping.targetField}`}
                    className="inline-flex rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700"
                  >
                    {mapping.targetField}
                  </span>
                ))}

                {feed.columnMappings.length > 10 && (
                  <span className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                    +{feed.columnMappings.length - 10}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-5 border-t border-slate-200 pt-5">
              <p className="text-sm font-medium text-slate-800">
                Catégories
              </p>

              <div className="mt-3 space-y-2">
                {feed.categoryMappings.slice(0, 5).map((mapping) => (
                  <div
                    key={mapping.id}
                    className="rounded-lg border border-slate-200 px-3 py-2"
                  >
                    <p className="truncate text-xs text-slate-500">
                      {mapping.externalPath}
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {mapping.category.name}
                    </p>
                  </div>
                ))}

                {feed.categoryMappings.length === 0 && (
                  <p className="text-sm text-slate-500">
                    Aucun mapping actif.
                  </p>
                )}
              </div>

              {feed.categoryMappings.length > 5 && (
                <p className="mt-3 text-xs text-slate-500">
                  Et {feed.categoryMappings.length - 5} autre(s) mapping(s).
                </p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-600">{label}</p>

      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
        {value.toLocaleString("fr-FR")}
      </p>

      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </article>
  );
}

function Metric({
  label,
  value,
  secondary,
}: {
  label: string;
  value: number;
  secondary: string;
}) {
  return (
    <div className="bg-white px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-xl font-semibold text-slate-950">
        {value.toLocaleString("fr-FR")}
      </p>

      <p className="mt-1 text-xs text-slate-500">{secondary}</p>
    </div>
  );
}

function DefinitionList({
  title,
  rows,
}: {
  title: string;
  rows: Array<{
    label: string;
    value: string;
  }>;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </p>

      <dl className="mt-3 space-y-2 text-sm">
        {rows.map((row) => (
          <DefinitionRow
            key={`${title}-${row.label}`}
            label={row.label}
            value={row.value}
          />
        ))}
      </dl>
    </div>
  );
}

function DefinitionRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>

      <dd className="break-words text-right font-medium text-slate-800">
        {value}
      </dd>
    </div>
  );
}

function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <th
      scope="col"
      className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
    >
      {children}
    </th>
  );
}

function TableCell({ children }: { children: React.ReactNode }) {
  return (
    <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-700">
      {children}
    </td>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="px-6 py-12 text-center">
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}