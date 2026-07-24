import Link from "next/link";

import FeedSourceForm from "@/components/admin/FeedSourceForm";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NewFeedSourcePage() {
  const programs =
    await prisma.affiliateProgram.findMany({
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

      select: {
        id: true,
        siteId: true,
        name: true,
        active: true,

        merchant: {
          select: {
            name: true,
            active: true,
          },
        },

        network: {
          select: {
            name: true,
            active: true,
          },
        },
      },
    });

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link
          href="/admin/feeds"
          className="text-sm font-medium text-brand-700 hover:text-brand-800"
        >
          ← Retour aux flux
        </Link>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
          Ajouter un flux
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Configurez une nouvelle source de produits
          rattachée à un programme d’affiliation.
        </p>
      </div>

      {programs.length === 0 ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="font-semibold text-amber-950">
            Aucun programme d’affiliation
          </h2>

          <p className="mt-2 text-sm leading-6 text-amber-900">
            Un flux doit obligatoirement être rattaché
            à un programme, lui-même lié à un marchand
            et à un réseau.
          </p>
        </section>
      ) : (
        <FeedSourceForm
          mode="create"
          programs={programs}
          cancelHref="/admin/feeds"
          initialValues={{
            affiliateProgramId: null,

            name: "",
            slug: "",
            sourceUrl: "",

            format: "CSV",
            delimiter: ";",
            encoding: "utf-8",

            active: true,
            autoImport: false,

            frequency: "MANUAL_ONLY",
            timezone: "Europe/Paris",
          }}
        />
      )}
    </main>
  );
}