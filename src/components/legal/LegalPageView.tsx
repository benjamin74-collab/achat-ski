type LegalPageViewProps = {
  title: string;
  content: string;
  version?: string | null;
  effectiveDate?: Date | null;
  updatedAt: Date;
};

export default function LegalPageView({
  title,
  content,
  version,
  effectiveDate,
  updatedAt,
}: LegalPageViewProps) {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:py-14">
      <header className="mb-8 border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          {title}
        </h1>

        {version || effectiveDate ? (
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
            {version ? <span>Version {version}</span> : null}

            {effectiveDate ? (
              <span>
                Applicable à compter du{" "}
                {effectiveDate.toLocaleDateString("fr-FR")}
              </span>
            ) : null}
          </div>
        ) : null}
      </header>

      <article
        className="prose prose-slate max-w-none"
        dangerouslySetInnerHTML={{ __html: content }}
      />

      <footer className="mt-10 border-t border-slate-200 pt-5 text-sm text-slate-500">
        Dernière mise à jour le {updatedAt.toLocaleDateString("fr-FR")}
      </footer>
    </main>
  );
}