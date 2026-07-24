import MerchantForm from "@/components/admin/MerchantForm";

export default function NewMerchantPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold">
        Nouveau marchand
      </h1>

      <p className="mt-2 text-sm text-slate-600">
        Ajoutez une boutique dont les produits seront
        importés.
      </p>

      <div className="mt-8">
        <MerchantForm
          mode="create"
          initialValues={{
            name: "",
            slug: "",
            websiteUrl: "",
            platform: "OTHER",
            network: "",
            programId: "",
            status: "",
            active: true,
          }}
        />
      </div>
    </main>
  );
}