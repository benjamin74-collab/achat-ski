// src/lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  // Pas d'adapter => sessions JWT (obligatoire pour Credentials en v5)
  session: { strategy: "jwt" },

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

        if (email && pass && email === adminEmail && pass === adminPass) {
          // On conserve un utilisateur en DB pour avoir role, etc.
          const user = await prisma.user.upsert({
            where: { email },
            update: { role: Role.ADMIN, name: "Admin" },
            create: { email, role: Role.ADMIN, name: "Admin" },
          });
          return { id: user.id, email: user.email!, name: user.name ?? "Admin", role: user.role } as any;
        }
        return null;
      },
    }),

    // OAuth optionnel (fonctionne aussi sans adapter, l’utilisateur n’est pas persisté par NextAuth)
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
                role: Role.USER,
              } as any;
            },
          }),
        ]
      : []),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role ?? Role.USER;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = (token.role as string) ?? "USER";
      }
      return session;
    },
  },

  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
};
