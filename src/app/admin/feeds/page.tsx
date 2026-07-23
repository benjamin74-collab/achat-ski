import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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

  const seconds = Math.round(durationMs / 1_000);

  if (seconds < 60) {
    return `${seconds} s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes} min ${remainingSeconds} s`;
}

function getStatusLabel(
  statusV2: string | null | undefined,
  legacyStatus: string | null | undefined
): string {
  const status = (statusV2 || legacyStatus || "").toUpperCase();

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
      return status || "Inconnu";
  }
}

function getStatusClasses(
  statusV2: string | null | undefined,
  legacyStatus: string | null | undefined
): string {
  const status = (statusV2 || legacyStatus || "").toUpperCase();

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

    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

export default async function AdminFeedsPage() {
  const feeds = await prisma.feedSource.findMany({
    orderBy: [
      {
        active: "desc",
      },
      {
        name: "asc",
      },
    ],

    select: {
      id: true,
      siteId: true,
      name: true,
      slug: true,

      format: true,
      delimiter: true,
      encoding: true,

      active: true,
      autoImport: true,
      frequency: true,
      timezone: true,

      lastRunAt: true,
      lastSuccessAt: true,
      lastFailureAt: true,
      lastStatus: true,
      lastErrorMessage: true,

      affiliateProgram: {
        select: {
          id: true,

          merchant: {
            select: {
              id: true,
              name: true,
              slug: true,
              active: true,
            },
          },

          network: {
            select: {
              id: true,
              name: true,
              slug: true,
              active: true,
            },
          },
        },
      },

      columnMappings: {
        select: {
          id: true,
        },
      },

      categoryMappings: {
        where: {
          active: true,
        },
        select: {
          id: true,
        },
      },

      imports: {
        orderBy: {
          startedAt: "desc",
        },
        take: 1,

        select: {
          id: true,
          status: true,
          statusV2: true,

          totalRows: true,
          importedRows: true,
          skippedRows: true,
          errorsCount: true,
          warningsCount: true,

          createdProducts: true,
          updatedProducts: true,
          createdOffers: true,
          updatedOffers: true,

          startedAt: true,
          finishedAt: true,
          durationMs: true,

          errorMessage: true,
        },
      },
    },
  });

  const activeFeeds = feeds.filter((feed) => feed.active).length;
  const automaticFeeds = feeds.filter(
    (feed) => feed.active && feed.autoImport
  ).length;

  const failedFeeds = feeds.filter((feed) => {
    const lastImport = feed.imports[0];
    const status = (
      lastImport?.statusV2 ||
      lastImport?.status ||
      feed.lastStatus ||
      ""
    ).toUpperCase();

    return status === "FAILED" || status === "ERROR";
  }).length;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Administration
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            Flux d’affiliation
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Suivez les sources produits, les derniers imports, les mappings et
            les erreurs des marchands affiliés.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin"
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Retour à l’administration
          </Link>
        </div>
      </div>

      <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Flux configurés"
          value={feeds.length}
          description="Toutes sources confondues"
        />

        <SummaryCard
          label="Flux actifs"
          value={activeFeeds}
          description={`${feeds.length - activeFeeds} flux inactif(s)`}
        />

        <SummaryCard
          label="Imports automatiques"
          value={automaticFeeds}
          description="Flux actifs avec autoImport"
        />

        <SummaryCard
          label="Flux en erreur"
          value={failedFeeds}
          description={
            failedFeeds > 0
              ? "Une intervention est nécessaire"
              : "Aucune erreur détectée"
          }
          alert={failedFeeds > 0}
        />
      </section>

      {feeds.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <h2 className="text-lg font-semibold text-slate-950">
            Aucun flux configuré
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            Ajoutez un FeedSource pour commencer à importer les produits d’un
            marchand.
          </p>
        </section>
      ) : (
        <section className="space-y-5">
          {feeds.map((feed) => {
            const lastImport = feed.imports[0];

            const displayedStatusV2 =
              lastImport?.statusV2 || feed.lastStatus;

            const displayedLegacyStatus = lastImport?.status;

            const errorMessage =
              lastImport?.errorMessage || feed.lastErrorMessage;

            return (
              <article
                key={feed.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-semibold text-slate-950">
                        {feed.name}
                      </h2>

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
                          Automatique
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                      <span>
                        Marchand :{" "}
                        <strong className="font-medium text-slate-800">
                          {feed.affiliateProgram.merchant.name}
                        </strong>
                      </span>

                      <span>
                        Réseau :{" "}
                        <strong className="font-medium text-slate-800">
                          {feed.affiliateProgram.network.name}
                        </strong>
                      </span>

                      <span>
                        Site :{" "}
                        <strong className="font-medium text-slate-800">
                          {feed.siteId}
                        </strong>
                      </span>
                    </div>

                    <p className="mt-2 break-all font-mono text-xs text-slate-500">
                      {feed.slug} · flux #{feed.id}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={[
                        "inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset",
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

                    <Link
                      href={`/admin/feeds/${feed.id}`}
                      className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                      Voir le flux
                    </Link>
                  </div>
                </div>

                <div className="grid gap-px bg-slate-200 sm:grid-cols-2 xl:grid-cols-4">
                  <FeedStat
                    label="Dernière exécution"
                    value={formatDate(
                      lastImport?.startedAt || feed.lastRunAt
                    )}
                    secondary={
                      lastImport
                        ? formatDuration(lastImport.durationMs)
                        : "Aucun historique"
                    }
                  />

                  <FeedStat
                    label="Lignes importées"
                    value={
                      lastImport
                        ? lastImport.importedRows.toLocaleString("fr-FR")
                        : "—"
                    }
                    secondary={
                      lastImport
                        ? `${lastImport.totalRows.toLocaleString(
                            "fr-FR"
                          )} ligne(s) lue(s)`
                        : "Aucun import"
                    }
                  />

                  <FeedStat
                    label="Produits"
                    value={
                      lastImport
                        ? (
                            lastImport.createdProducts +
                            lastImport.updatedProducts
                          ).toLocaleString("fr-FR")
                        : "—"
                    }
                    secondary={
                      lastImport
                        ? `${lastImport.createdProducts} créé(s), ${lastImport.updatedProducts} mis à jour`
                        : "Aucun import"
                    }
                  />

                  <FeedStat
                    label="Offres"
                    value={
                      lastImport
                        ? (
                            lastImport.createdOffers +
                            lastImport.updatedOffers
                          ).toLocaleString("fr-FR")
                        : "—"
                    }
                    secondary={
                      lastImport
                        ? `${lastImport.createdOffers} créée(s), ${lastImport.updatedOffers} mise(s) à jour`
                        : "Aucun import"
                    }
                  />
                </div>

                <div className="grid gap-5 px-5 py-5 lg:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Configuration
                    </p>

                    <dl className="mt-3 space-y-2 text-sm">
                      <DefinitionRow
                        label="Format"
                        value={String(feed.format)}
                      />

                      <DefinitionRow
                        label="Séparateur"
                        value={
                          feed.delimiter === "\t"
                            ? "Tabulation"
                            : feed.delimiter || "Automatique"
                        }
                      />

                      <DefinitionRow
                        label="Encodage"
                        value={feed.encoding || "Non précisé"}
                      />

                      <DefinitionRow
                        label="Fréquence"
                        value={String(feed.frequency)}
                      />

                      <DefinitionRow
                        label="Fuseau horaire"
                        value={feed.timezone || "Europe/Paris"}
                      />
                    </dl>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Mappings
                    </p>

                    <dl className="mt-3 space-y-2 text-sm">
                      <DefinitionRow
                        label="Colonnes"
                        value={`${feed.columnMappings.length} mapping(s)`}
                      />

                      <DefinitionRow
                        label="Catégories"
                        value={`${feed.categoryMappings.length} mapping(s) actif(s)`}
                      />

                      <DefinitionRow
                        label="Dernier succès"
                        value={formatDate(feed.lastSuccessAt)}
                      />

                      <DefinitionRow
                        label="Dernier échec"
                        value={formatDate(feed.lastFailureAt)}
                      />
                    </dl>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Qualité du dernier import
                    </p>

                    <dl className="mt-3 space-y-2 text-sm">
                      <DefinitionRow
                        label="Lignes ignorées"
                        value={
                          lastImport
                            ? lastImport.skippedRows.toLocaleString("fr-FR")
                            : "—"
                        }
                      />

                      <DefinitionRow
                        label="Avertissements"
                        value={
                          lastImport
                            ? lastImport.warningsCount.toLocaleString("fr-FR")
                            : "—"
                        }
                      />

                      <DefinitionRow
                        label="Erreurs"
                        value={
                          lastImport
                            ? lastImport.errorsCount.toLocaleString("fr-FR")
                            : "—"
                        }
                      />

                      <DefinitionRow
                        label="Terminé le"
                        value={formatDate(lastImport?.finishedAt)}
                      />
                    </dl>
                  </div>
                </div>

                {errorMessage && (
                  <div className="border-t border-red-200 bg-red-50 px-5 py-4">
                    <p className="text-sm font-semibold text-red-900">
                      Dernière erreur
                    </p>

                    <p className="mt-1 whitespace-pre-wrap break-words text-sm text-red-800">
                      {errorMessage}
                    </p>
                  </div>
                )}
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}

function SummaryCard({
  label,
  value,
  description,
  alert = false,
}: {
  label: string;
  value: number;
  description: string;
  alert?: boolean;
}) {
  return (
    <article
      className={[
        "rounded-2xl border bg-white p-5 shadow-sm",
        alert ? "border-red-200" : "border-slate-200",
      ].join(" ")}
    >
      <p className="text-sm font-medium text-slate-600">{label}</p>

      <p
        className={[
          "mt-2 text-3xl font-bold tracking-tight",
          alert ? "text-red-700" : "text-slate-950",
        ].join(" ")}
      >
        {value.toLocaleString("fr-FR")}
      </p>

      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </article>
  );
}

function FeedStat({
  label,
  value,
  secondary,
}: {
  label: string;
  value: string;
  secondary: string;
}) {
  return (
    <div className="bg-white px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>

      <p className="mt-1 text-xs text-slate-500">{secondary}</p>
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

      <dd className="text-right font-medium text-slate-800">{value}</dd>
    </div>
  );
}