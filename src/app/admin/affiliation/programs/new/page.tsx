import AffiliateProgramForm from "@/components/admin/AffiliateProgramForm";
import { prisma } from "@/lib/prisma";

type Props = {
  searchParams: Promise<{
    returnTo?: string;
  }>;
};

export default async function NewAffiliateProgramPage({
  searchParams,
}: Props) {
  const { returnTo } = await searchParams;

  const [merchants, networks, settings] =
    await Promise.all([
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

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold">
        Nouveau programme d’affiliation
      </h1>

      <div className="mt-8">
        <AffiliateProgramForm
          mode="create"
          returnTo={returnTo}
          merchants={merchants}
          networks={networks}
          siteIds={settings.map(
            (setting) => setting.siteId
          )}
          initialValues={{
            siteId: "",
            merchantId: null,
            networkId: null,
            name: "",
            externalProgramId: "",
            trackingId: "",
            active: true,
          }}
        />
      </div>
    </main>
  );
}