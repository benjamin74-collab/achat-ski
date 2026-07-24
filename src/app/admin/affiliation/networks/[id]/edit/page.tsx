import { notFound } from "next/navigation";

import AffiliateNetworkForm from "@/components/admin/AffiliateNetworkForm";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditAffiliateNetworkPage({
  params,
}: Props) {
  const { id } = await params;
  const networkId = Number.parseInt(id, 10);

  const network =
    await prisma.affiliateNetwork.findUnique({
      where: {
        id: networkId,
      },
    });

  if (!network) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold">
        Modifier {network.name}
      </h1>

      <div className="mt-8">
        <AffiliateNetworkForm
          mode="edit"
          networkId={network.id}
          initialValues={{
            name: network.name,
            slug: network.slug,
            websiteUrl:
              network.websiteUrl || "",
            active: network.active,
          }}
        />
      </div>
    </main>
  );
}