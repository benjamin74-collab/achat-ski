// src/lib/auth.ts
import type { NextAuthOptions, Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

/**
 * NextAuth config
 * - Sessions en JWT (requis par Credentials)
 * - Admin via variables d'env (ADMIN_EMAIL / ADMIN_PASSWORD)
 * - GitHub optionnel si variables présentes
 */
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

          const user: User = {
            id: String(dbUser.id),
            email: dbUser.email ?? undefined,
            name: dbUser.name ?? "Admin",
            role: "ADMIN",
          };
          return user;
        }

      // (Plus tard) gérer l’auth public ici
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
              return {
                id: String(profile.id),
                name: profile.name ?? profile.login,
                email: profile.email ?? undefined,
                // image ignorée par le type `User` (c’est ok, elle va sur session.user.image)
                role: "USER",
              };
            },
          }),
        ]
      : []),
  ],

  callbacks: {
    async jwt({ token, user }): Promise<JWT> {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? "USER";
      }
      return token;
    },

    async session({ session, token }): Promise<Session> {
      if (session.user) {
        // ces champs sont déclarés dans src/types/next-auth.d.ts
        session.user.id = token.id ?? "";
        session.user.role = (token.role as "ADMIN" | "USER") ?? "USER";
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};
