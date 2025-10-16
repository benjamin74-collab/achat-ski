// src/lib/auth.ts
import type { NextAuthOptions, Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

type RoleLiteral = "ADMIN" | "USER";
type UserWithRole = User & { role?: RoleLiteral };

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },

  providers: [
    CredentialsProvider({
      name: "Connexion",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials): Promise<User | null> {
        const email = (credentials?.email || "").toLowerCase().trim();
        const pass = credentials?.password || "";

        const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
        const adminPass = process.env.ADMIN_PASSWORD || "";

        // Admin “MVP” via variables d’env
        if (email && pass && email === adminEmail && pass === adminPass) {
          const dbUser = await prisma.user.upsert({
            where: { email },
            update: { role: Role.ADMIN, name: "Admin" },
            create: { email, role: Role.ADMIN, name: "Admin" },
          });

          const user: UserWithRole = {
            id: String(dbUser.id),
            email: dbUser.email ?? undefined,
            name: dbUser.name ?? "Admin",
            role: "ADMIN",
          };
          return user;
        }

        // (Plus tard) gestion des comptes publics
        return null;
      },
    }),

    ...(process.env.GITHUB_ID && process.env.GITHUB_SECRET
      ? [
          GitHub({
            clientId: process.env.GITHUB_ID!,
            clientSecret: process.env.GITHUB_SECRET!,
            allowDangerousEmailAccountLinking: true,
            profile(profile): User {
              const u: UserWithRole = {
                id: String(profile.id),
                name: profile.name ?? profile.login,
                email: profile.email ?? undefined,
                role: "USER",
              };
              return u;
            },
          }),
        ]
      : []),
  ],

  callbacks: {
    // ➜ Redirection post-login : ADMIN → /admin, sinon /me
    async signIn({ user }): Promise<string | boolean> {
      const role = (user as UserWithRole).role ?? "USER";
      return role === "ADMIN" ? "/admin" : "/me";
    },

    async jwt({ token, user }): Promise<JWT> {
      if (user) {
        const role = (user as UserWithRole).role ?? "USER";
        (token as JWT & { id?: string; role?: RoleLiteral }).id = user.id;
        (token as JWT & { id?: string; role?: RoleLiteral }).role = role;
      }
      return token;
    },

    async session({ session, token }): Promise<Session> {
      if (session.user) {
        (session.user as typeof session.user & { id: string; role: RoleLiteral }).id =
          (token as JWT & { id?: string }).id ?? "";
        (session.user as typeof session.user & { id: string; role: RoleLiteral }).role =
          ((token as JWT & { role?: RoleLiteral }).role ?? "USER") as RoleLiteral;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};
