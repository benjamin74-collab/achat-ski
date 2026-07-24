import { notFound } from "next/navigation";

import MerchantForm from "@/components/admin/MerchantForm";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditMerchantPage({
  params,
}: Props) {
  const { id } = await params;
  const merchantId = Number.parseInt(id, 10);

  const merchant = await prisma.merchant.findUnique({
    where: {
      id: merchantId,
    },
  });

  if (!merchant) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold">
        Modifier {merchant.name}
      </h1>

      <div className="mt-8">
        <MerchantForm
          mode="edit"
          merchantId={merchant.id}
          initialValues={{
            name: merchant.name,
            slug: merchant.slug,
            websiteUrl:
              merchant.websiteUrl || "",
            platform: merchant.platform,
            network: merchant.network || "",
            programId:
              merchant.programId || "",
            status: merchant.status || "",
            active: merchant.active,
          }}
        />
      </div>
    </main>
  );
}