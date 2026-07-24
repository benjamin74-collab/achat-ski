import AffiliateNetworkForm from "@/components/admin/AffiliateNetworkForm";

export default function NewAffiliateNetworkPage() {
  return (
    <AdminFormPage
      title="Nouveau réseau d’affiliation"
      description="Ajoutez une plateforme comme Awin, Kwanko ou Affilae."
    >
      <AffiliateNetworkForm
        mode="create"
        initialValues={{
          name: "",
          slug: "",
          websiteUrl: "",
          active: true,
        }}
      />
    </AdminFormPage>
  );
}

function AdminFormPage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-slate-600">
        {description}
      </p>
      <div className="mt-8">{children}</div>
    </main>
  );
}