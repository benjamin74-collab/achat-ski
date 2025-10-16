// src/lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

/**
 * NextAuth v4 config
 * - JWT sessions (required for Credentials provider)
 * - Admin login via env (ADMIN_EMAIL / ADMIN_PASSWORD)
 * - Optional GitHub OAuth if env present
 */
export const authOptions: NextAuthOptions = {
  // IMPORTANT: Credentials require JWT strategy (no adapter necessary)
  session: { strategy: "jwt" },

  providers: [
    CredentialsProvider({
      name: "Connexion",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        const email = (credentials?.email || "").toLowerCase().trim();
        const pass = credentials?.password || "";

        const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
        const adminPass = process.env.ADMIN_PASSWORD || "";

        // MVP admin via variables d'env
        if (email && pass && email === adminEmail && pass === adminPass) {
          // On garde l’écriture DB pour traçabilité (et futur BO)
          const user = await prisma.user.upsert({
            where: { email },
            update: { role: Role.ADMIN, name: "Admin" },
            create: { email, role: Role.ADMIN, name: "Admin" },
          });

          return {
            id: String(user.id),
            email: user.email!,
            name: user.name ?? "Admin",
            // Ces champs custom seront injectés dans le JWT via callbacks.jwt
            role: user.role,
          } as any;
        }

        // (Plus tard) gérer d’autres comptes publics ici
        return null;
      },
    }),

    ...(process.env.GITHUB_ID && process.env.GITHUB_SECRET
      ? [
          GitHub({
            clientId: process.env.GITHUB_ID!,
            clientSecret: process.env.GITHUB_SECRET!,
            allowDangerousEmailAccountLinking: true,
            profile(profile) {
              // Par défaut, rôle USER
              return {
                id: String(profile.id),
                name: profile.name ?? profile.login,
                email: profile.email,
                image: profile.avatar_url,
                role: "USER",
              } as any;
            },
          }),
        ]
      : []),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // Injecter id/role dans le JWT au moment du login
      if (user) {
        token.id = (user as any).id ?? token.id;
        token.role = (user as any).role ?? token.role ?? "USER";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role ?? "USER";
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};
