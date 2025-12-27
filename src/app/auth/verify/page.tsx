// src/app/auth/verify/page.tsx
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

type Props = {
  searchParams: { token?: string };
};

export default async function VerifyPage({ searchParams }: Props) {
  const token = searchParams.token;

  if (!token) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-ring bg-white p-6 shadow-card">
          <h1 className="text-xl font-semibold text-center mb-2">
            Lien invalide
          </h1>
          <p className="text-sm text-neutral-700 text-center">
            Le lien de validation est invalide ou manquant.
          </p>
        </div>
      </main>
    );
  }

  const record = await prisma.emailVerificationToken.findUnique({
    where: { token },
  });

  if (!record || record.expiresAt < new Date()) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-ring bg-white p-6 shadow-card">
          <h1 className="text-xl font-semibold text-center mb-2">
            Lien expiré
          </h1>
          <p className="text-sm text-neutral-700 text-center">
            Ce lien de validation a expiré ou a déjà été utilisé.
          </p>
          <p className="mt-2 text-xs text-neutral-600 text-center">
            Si besoin, tu peux refaire une inscription ou demander un nouveau lien
            de validation depuis la page de connexion.
          </p>
        </div>
      </main>
    );
  }

  // Marquer l'utilisateur comme vérifié + supprimer le token
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: new Date() },
    }),
    prisma.emailVerificationToken.delete({
      where: { token },
    }),
  ]);

  // Rediriger vers la page de connexion avec un message de succès
  redirect("/auth/signin?verified=1");
}
