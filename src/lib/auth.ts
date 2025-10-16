// src/lib/auth.ts
import type { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { Role } from "@prisma/client";

/** Utilisateur minimal qu’on retourne depuis authorize() */
type AuthUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  role?: Role | null;
};

export const authOptions: NextAuthOptions = {
  // Credentials en v5 => stratégie JWT obligatoire
  session: { strategy: "jwt" },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials): Promise<AuthUser | null> {
        const email = (credentials?.email || "").toLowerCase().trim();
        const pass = credentials?.password || "";

        const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
        const adminPass = process.env.ADMIN_PASSWORD || "";

        // Admin “MVP” par variables d’env
        if (email && pass && email === adminEmail && pass === adminPass) {
          const user = await prisma.user.upsert({
            where: { email },
            update: { role: Role.ADMIN, name: "Admin" },
            create: { email, role: Role.ADMIN, name: "Admin" },
          });

          const authUser: AuthUser = {
            id: user.id,
            email: user.email,
            name: user.name ?? "Admin",
            role: user.role,
          };
          return authUser;
        }

        // Sinon, pas d’accès via credentials
        return null;
      },
    }),

    // OAuth optionnel (fonctionne même sans adapter ; non persisté par NextAuth)
    ...(process.env.GITHUB_ID && process.env.GITHUB_SECRET
      ? [
          GitHub({
            clientId: process.env.GITHUB_ID!,
            clientSecret: process.env.GITHUB_SECRET!,
            allowDangerousEmailAccountLinking: true,
            profile(profile): AuthUser {
              return {
                id: String(profile.id),
                name: profile.name ?? profile.login ?? null,
                email: (profile as unknown as { email?: string | null }).email ?? null,
                image: (profile as unknown as { avatar_url?: string | null }).avatar_url ?? null,
                role: Role.USER,
              };
            },
          }),
        ]
      : []),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // On propage id/role au token JWT lors du login
      if (user) {
        const u = user as AuthUser;
        token.id = u.id;
        token.role = (u.role ?? Role.USER) as Role;
      }
      return token;
    },
    async session({ session, token }) {
      // On expose id/role dans session.user (types étendus dans next-auth.d.ts)
      if (session.user) {
        session.user.id = typeof token.id === "string" ? token.id : "";
        session.user.role =
          (typeof token.role === "string" ? (token.role as Role) : (token.role as Role | undefined)) ?? Role.USER;
      }
      return session;
    },
  },

  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
};
