import Link from "next/link";

import DeleteAffiliationEntityButton from "@/components/admin/DeleteAffiliationEntityButton";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminAffiliationPage() {
  const [networks, merchants, programs] =
    await Promise.all([
      prisma.affiliateNetwork.findMany({
        orderBy: {
          name: "asc",
        },
        include: {
          _count: {
            select: {
              programs: true,
            },
          },
        },
      }),

      prisma.merchant.findMany({
        orderBy: {
          name: "asc",
        },
        include: {
          _count: {
            select: {
              affiliatePrograms: true,
              offers: true,
            },
          },
        },
      }),

      prisma.affiliateProgram.findMany({
        orderBy: [
          {
            siteId: "asc",
          },
          {
            merchant: {
              name: "asc",
            },
          },
        ],
        include: {
          merchant: true,
          network: true,
          _count: {
            select: {
              feeds: true,
              offers: true,
            },
          },
        },
      }),
    ]);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-medium text-slate-500">
          Administration
        </p>

        <h1 className="mt-1 text-3xl font-bold text-slate-950">
          Marchands & affiliation
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Gérez les réseaux, les marchands et les
          programmes disponibles pour les flux
          produits.
        </p>
      </div>

      <EntitySection
        title="Réseaux d’affiliation"
        description="Awin, Kwanko, Affilae, réseau direct…"
        createHref="/admin/affiliation/networks/new"
        createLabel="+ Nouveau réseau"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500">
                <th className="px-4 py-3">Réseau</th>
                <th className="px-4 py-3">Site web</th>
                <th className="px-4 py-3">
                  Programmes
                </th>
                <th className="px-4 py-3">État</th>
                <th className="px-4 py-3">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {networks.map((network) => (
                <tr key={network.id}>
                  <td className="px-4 py-3">
                    <div className="font-semibold">
                      {network.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {network.slug}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    {network.websiteUrl || "—"}
                  </td>

                  <td className="px-4 py-3">
                    {network._count.programs}
                  </td>

                  <td className="px-4 py-3">
                    <Status active={network.active} />
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <Link
                        href={`/admin/affiliation/networks/${network.id}/edit`}
                        className="font-medium text-brand-700"
                      >
                        Modifier
                      </Link>

                      <DeleteAffiliationEntityButton
                        entityType="network"
                        entityId={network.id}
                        entityName={network.name}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </EntitySection>

      <EntitySection
        title="Marchands"
        description="Les boutiques et vendeurs dont les produits sont importés."
        createHref="/admin/affiliation/merchants/new"
        createLabel="+ Nouveau marchand"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500">
                <th className="px-4 py-3">
                  Marchand
                </th>
                <th className="px-4 py-3">
                  Plateforme
                </th>
                <th className="px-4 py-3">
                  Programmes
                </th>
                <th className="px-4 py-3">
                  Offres
                </th>
                <th className="px-4 py-3">État</th>
                <th className="px-4 py-3">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {merchants.map((merchant) => (
                <tr key={merchant.id}>
                  <td className="px-4 py-3">
                    <div className="font-semibold">
                      {merchant.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {merchant.websiteUrl ||
                        merchant.slug}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    {merchant.platform}
                  </td>

                  <td className="px-4 py-3">
                    {
                      merchant._count
                        .affiliatePrograms
                    }
                  </td>

                  <td className="px-4 py-3">
                    {merchant._count.offers}
                  </td>

                  <td className="px-4 py-3">
                    <Status active={merchant.active} />
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <Link
                        href={`/admin/affiliation/merchants/${merchant.id}/edit`}
                        className="font-medium text-brand-700"
                      >
                        Modifier
                      </Link>

                      <DeleteAffiliationEntityButton
                        entityType="merchant"
                        entityId={merchant.id}
                        entityName={merchant.name}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </EntitySection>

      <EntitySection
        title="Programmes d’affiliation"
        description="Association entre un site, un marchand et un réseau."
        createHref="/admin/affiliation/programs/new"
        createLabel="+ Nouveau programme"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500">
                <th className="px-4 py-3">
                  Programme
                </th>
                <th className="px-4 py-3">Site</th>
                <th className="px-4 py-3">
                  Marchand
                </th>
                <th className="px-4 py-3">
                  Réseau
                </th>
                <th className="px-4 py-3">Flux</th>
                <th className="px-4 py-3">État</th>
                <th className="px-4 py-3">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {programs.map((program) => (
                <tr key={program.id}>
                  <td className="px-4 py-3">
                    <div className="font-semibold">
                      {program.name ||
                        `${program.merchant.name} / ${program.siteId}`}
                    </div>
                    <div className="text-xs text-slate-500">
                      {program.externalProgramId ||
                        "Aucun identifiant externe"}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    {program.siteId}
                  </td>

                  <td className="px-4 py-3">
                    {program.merchant.name}
                  </td>

                  <td className="px-4 py-3">
                    {program.network.name}
                  </td>

                  <td className="px-4 py-3">
                    {program._count.feeds}
                  </td>

                  <td className="px-4 py-3">
                    <Status active={program.active} />
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <Link
                        href={`/admin/affiliation/programs/${program.id}/edit`}
                        className="font-medium text-brand-700"
                      >
                        Modifier
                      </Link>

                      <DeleteAffiliationEntityButton
                        entityType="program"
                        entityId={program.id}
                        entityName={
                          program.name ||
                          program.merchant.name
                        }
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </EntitySection>
    </main>
  );
}

function EntitySection({
  title,
  description,
  createHref,
  createLabel,
  children,
}: {
  title: string;
  description: string;
  createHref: string;
  createLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            {title}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {description}
          </p>
        </div>

        <Link
          href={createHref}
          className="inline-flex min-h-10 items-center justify-center rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white"
        >
          {createLabel}
        </Link>
      </div>

      {children}
    </section>
  );
}

function Status({
  active,
}: {
  active: boolean;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        active
          ? "bg-emerald-100 text-emerald-800"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      {active ? "Actif" : "Inactif"}
    </span>
  );
}