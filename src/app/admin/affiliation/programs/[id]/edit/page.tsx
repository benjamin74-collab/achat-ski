import { notFound } from "next/navigation";

import AffiliateProgramForm from "@/components/admin/AffiliateProgramForm";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditAffiliateProgramPage({
  params,
}: Props) {
  const { id } = await params;
  const programId = Number.parseInt(id, 10);

  const [program, merchants, networks, settings] =
    await Promise.all([
      prisma.affiliateProgram.findUnique({
        where: {
          id: programId,
        },
      }),

      prisma.merchant.findMany({
        orderBy: {
          name: "asc",
        },
        select: {
          id: true,
          name: true,
          active: true,
        },
      }),

      prisma.affiliateNetwork.findMany({
        orderBy: {
          name: "asc",
        },
        select: {
          id: true,
          name: true,
          active: true,
        },
      }),

      prisma.siteSettings.findMany({
        orderBy: {
          siteId: "asc",
        },
        select: {
          siteId: true,
        },
      }),
    ]);

  if (!program) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold">
        Modifier le programme
      </h1>

      <div className="mt-8">
        <AffiliateProgramForm
          mode="edit"
          programId={program.id}
          merchants={merchants}
          networks={networks}
          siteIds={settings.map(
            (setting) => setting.siteId
          )}
          initialValues={{
            siteId: program.siteId,
            merchantId: program.merchantId,
            networkId: program.networkId,
            name: program.name || "",
            externalProgramId:
              program.externalProgramId || "",
            trackingId:
              program.trackingId || "",
            active: program.active,
          }}
        />
      </div>
    </main>
  );
}