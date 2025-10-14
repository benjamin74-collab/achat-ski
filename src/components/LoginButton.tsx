// src/components/LoginButton.tsx
"use client";

import { useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";

export default function LoginButton() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);

  // Pendant le chargement, évite le “flash”
  if (status === "loading") {
    return (
      <div className="h-9 min-w-20 animate-pulse rounded-lg bg-muted" />
    );
  }

  if (!session?.user) {
    return (
      <button
        onClick={() => signIn()} // page par défaut NextAuth
        className="btn"
      >
        Se connecter
      </button>
    );
  }

  const initials =
    session.user.name?.[0]?.toUpperCase() ??
    session.user.email?.[0]?.toUpperCase() ??
    "U";
  const role = (session.user as any).role ?? "user";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-lg border border-ring bg-white px-3 py-2 text-sm hover:bg-muted"
      >
        <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-500 text-white text-xs">
          {initials}
        </span>
        <span className="hidden sm:inline">
          {session.user.email ?? "Profil"}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-lg border border-ring bg-white p-2 shadow-lg">
          <div className="px-2 py-1 text-xs text-slate-500">
            Connecté en tant que
          </div>
          <div className="truncate px-2 py-1 text-sm">
            {session.user.email}
          </div>
          <div className="px-2 pb-2 text-xs text-slate-500">
            Rôle : <span className="font-medium">{role}</span>
          </div>

          <div className="my-1 h-px bg-ring" />

          {/* Lien vers un futur tableau de bord */}
          <Link
            href="/compte"
            className="block rounded-md px-2 py-2 text-sm hover:bg-muted"
            onClick={() => setOpen(false)}
          >
            Mon profil
          </Link>

          {role === "admin" && (
            <Link
              href="/admin"
              className="block rounded-md px-2 py-2 text-sm hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              Admin
            </Link>
          )}

          <button
            onClick={() => signOut()}
            className="mt-1 w-full rounded-md px-2 py-2 text-left text-sm text-red-600 hover:bg-red-50"
          >
            Se déconnecter
          </button>
        </div>
      )}
    </div>
  );
}
