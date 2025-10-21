// src/lib/auth.ts
import type { NextAuthOptions, Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

type RoleLiteral = "ADMIN" | "USER";
type UserWithRole = User & { role?: RoleLiteral };
type JwtWithRole = JWT & { id?: string; role?: RoleLiteral };

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
        return null; // (plus tard) comptes publics
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
    // Ne redirige PAS ici avec signIn(); laisse redirect() gérer.
    async signIn(): Promise<boolean> {
      return true;
    },

    async jwt({ token, user }): Promise<JWT> {
      if (user) {
        const role = (user as UserWithRole).role ?? "USER";
        (token as JwtWithRole).id = user.id;
        (token as JwtWithRole).role = role;
      }
      return token;
    },

    async session({ session, token }): Promise<Session> {
      if (session.user) {
        (session.user as typeof session.user & { id: string; role: RoleLiteral }).id =
          (token as JwtWithRole).id ?? "";
        (session.user as typeof session.user & { id: string; role: RoleLiteral }).role =
          ((token as JwtWithRole).role ?? "USER") as RoleLiteral;
      }
      return session;
    },

    // ✅ Toute redirection passe ici. On choisit /admin pour ADMIN, /me sinon.
    async redirect({ url, baseUrl, token }): Promise<string> {
      const jwt = token as JwtWithRole | null;

      // Si on nous envoie vers la racine ou une page générique (ex: ancien /after-login),
      // on choisit la destination selon le rôle.
      const shouldRouteByRole =
        url === baseUrl ||
        url === `${baseUrl}/` ||
        url.endsWith("/after-login") ||
        url.endsWith("/api/auth/signin");

      if (shouldRouteByRole) {
        const dest = jwt?.role === "ADMIN" ? "/admin" : "/me";
        return `${baseUrl}${dest}`;
      }

      // URLs relatives -> même origine
      if (url.startsWith("/")) return `${baseUrl}${url}`;

      // Même origine -> ok
      try {
        const u = new URL(url);
        if (u.origin === baseUrl) return url;
      } catch {
        /* noop */
      }

      // fallback
      return baseUrl;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};
