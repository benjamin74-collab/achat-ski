// src/app/auth/check-email/page.tsx

type Props = {
  searchParams: { email?: string };
};

export default function CheckEmailPage({ searchParams }: Props) {
  const email = searchParams.email;

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-ring bg-white p-6 shadow-card">
        <h1 className="text-xl font-semibold text-center mb-2">
          Valide ton compte
        </h1>
        <p className="text-sm text-neutral-700 text-center">
          {email ? (
            <>
              Nous avons envoyé un email à{" "}
              <span className="font-medium">{email}</span>.
            </>
          ) : (
            <>Nous t&apos;avons envoyé un email de validation.</>
          )}
        </p>
        <p className="mt-2 text-xs text-neutral-600 text-center">
          Clique sur le lien dans cet email pour activer ton compte.
          Pense à vérifier tes spams si tu ne le vois pas.
        </p>
      </div>
    </main>
  );
}
