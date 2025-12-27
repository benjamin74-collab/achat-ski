import Link from "next/link";

type PageProps = {
  searchParams?: {
    [key: string]: string | string[] | undefined;
  };
};

export default function CheckEmailPage({ searchParams }: PageProps) {
  const emailParam = searchParams?.email;
  const email =
    typeof emailParam === "string"
      ? emailParam
      : Array.isArray(emailParam)
      ? emailParam[0]
      : null;

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-ring bg-white p-6 shadow-card">
        <h1 className="text-xl font-semibold text-center mb-2">
          Vérifie ta boîte mail
        </h1>

        <p className="text-sm text-neutral-700 text-center mb-3">
          {email ? (
            <>
              Nous t&apos;avons envoyé un email de confirmation à{" "}
              <span className="font-medium">{email}</span>.
            </>
          ) : (
            <>Nous t&apos;avons envoyé un email de confirmation.</>
          )}
        </p>

        <p className="text-xs text-neutral-600 text-center mb-4">
          Clique sur le lien de validation dans cet email pour activer ton
          compte Meilleur-Ski.
          <br />
          Pense aussi à vérifier tes dossiers <strong>spam</strong> ou{" "}
          <strong>courrier indésirable</strong>.
        </p>

        <div className="flex flex-col gap-2 mt-2">
          <Link href="/" className="btn text-center">
            Retour à l&apos;accueil
          </Link>

          <p className="text-[11px] text-neutral-500 text-center">
            Si tu ne reçois rien au bout de quelques minutes, vérifie ton
            adresse email ou réessaie de créer ton compte.
          </p>
        </div>
      </div>
    </main>
  );
}
