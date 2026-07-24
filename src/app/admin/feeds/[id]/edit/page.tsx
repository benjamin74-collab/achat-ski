import Link from "next/link";
import { notFound } from "next/navigation";

import FeedSourceForm from "@/components/admin/FeedSourceForm";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type EditFeedSourcePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditFeedSourcePage({
  params,
}: EditFeedSourcePageProps) {
  const { id } = await params;
  const feedId = Number.parseInt(id, 10);

  if (!Number.isInteger(feedId) || feedId <= 0) {
    notFound();
  }

  const [feed, programs] = await Promise.all([
    prisma.feedSource.findUnique({
      where: {
        id: feedId,
      },

      select: {
        id: true,
        affiliateProgramId: true,

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
    }),
  ]);

  if (!feed) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link
          href={`/admin/feeds/${feed.id}`}
          className="text-sm font-medium text-brand-700 hover:text-brand-800"
        >
          ← Retour au flux
        </Link>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
          Modifier le flux
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Modifiez la source, le format et la
          planification de « {feed.name} ».
        </p>
      </div>

      <FeedSourceForm
        mode="edit"
        feedId={feed.id}
        programs={programs}
        cancelHref={`/admin/feeds/${feed.id}`}
        initialValues={{
          affiliateProgramId:
            feed.affiliateProgramId,

          name: feed.name,
          slug: feed.slug,
          sourceUrl: feed.sourceUrl,

          format: feed.format,
          delimiter: feed.delimiter,
          encoding: feed.encoding,

          active: feed.active,
          autoImport: feed.autoImport,

          frequency: feed.frequency,
          timezone: feed.timezone,
        }}
      />
    </main>
  );
}