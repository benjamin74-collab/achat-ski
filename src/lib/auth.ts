// src/lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  // On garde l'adapter pour gérer User/Account en DB si besoin,
  // mais on passe la stratégie de session en JWT (obligatoire pour Credentials en v5).
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
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

        // Accès admin simple (MVP) via .env
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
            // on met le rôle ici pour le récupérer dans le callback jwt
            role: user.role,
          } as any;
        }

        // (Plus tard) ouvrir la connexion USER publique
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
              return {
                id: String(profile.id),
                name: profile.name ?? profile.login,
                email: profile.email,
                image: profile.avatar_url,
                // Par défaut, on laisse USER
                role: Role.USER,
              } as any;
            },
          }),
        ]
      : []),
  ],

  callbacks: {
    // On met id/role dans le JWT au moment du sign-in
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role ?? Role.USER;
      }
      return token;
    },
    // … et on expose id/role dans la session côté client
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? "USER";
      }
      return session;
    },
  },

  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
};
