// src/lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    // On stocke les sessions en DB (via adapter)
    strategy: "database",
  },
  providers: [
    // --- Admin par credentials (EMAIL + PASSWORD en .env) ---
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        const email = (credentials?.email || "").toLowerCase().trim();
        const pass = credentials?.password || "";

        const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
        const adminPass = process.env.ADMIN_PASSWORD || "";

        // Accès admin simple (MVP) : variables d'environnement
        if (email && pass && email === adminEmail && pass === adminPass) {
          const user = await prisma.user.upsert({
            where: { email },
            update: { role: Role.ADMIN, name: "Admin" },
            create: { email, role: Role.ADMIN, name: "Admin" },
          });
          return {
            id: user.id,
            email: user.email!,
            name: user.name ?? "Admin",
          };
        }

        // (Optionnel) autoriser des comptes "USER" via une autre stratégie / formulaire public plus tard.
        return null;
      },
    }),

    // --- GitHub (optionnel) : activé si variables présentes ---
    ...(process.env.GITHUB_ID && process.env.GITHUB_SECRET
      ? [
          GitHub({
            clientId: process.env.GITHUB_ID!,
            clientSecret: process.env.GITHUB_SECRET!,
            allowDangerousEmailAccountLinking: true,
            profile(profile) {
              // On laisse par défaut USER, l’admin passe par credentials env.
              return {
                id: String(profile.id),
                name: profile.name ?? profile.login,
                email: profile.email,
                image: profile.avatar_url,
              };
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async session({ session, user }) {
      // On expose l'id & role dans la session
      if (session.user) {
        (session.user as any).id = user.id;
        (session.user as any).role = user.role;
      }
      return session;
    },
  },
  // URLs par défaut. Tu pourras ajouter des pages custom (signIn, error, etc.) plus tard.
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
};
