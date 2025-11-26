// src/lib/auth.ts
import type { NextAuthOptions, Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";

type RoleLiteral = "ADMIN" | "USER";
type UserWithRole = User & { role?: RoleLiteral };
type JwtWithRole = JWT & { id?: string; role?: RoleLiteral };

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },

  // ➜ on branche notre page custom
  pages: {
    signIn: "/auth/signin",
  },

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

        if (!email || !pass) return null;

        const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
        const adminPass = process.env.ADMIN_PASSWORD || "";

        // 🔐 1) Cas ADMIN : email + mot de passe env
        if (email === adminEmail && pass === adminPass) {
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

        // 👤 2) Cas utilisateur classique : lookup en base + passwordHash
        const dbUser = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            passwordHash: true,
            pseudo: true,
            firstName: true,
            lastName: true,
          },
        });

        if (!dbUser || !dbUser.passwordHash) {
          return null;
        }

        const ok = await bcrypt.compare(pass, dbUser.passwordHash);
        if (!ok) return null;

        const displayName =
          dbUser.pseudo ||
          [dbUser.firstName, dbUser.lastName].filter(Boolean).join(" ") ||
          dbUser.name ||
          dbUser.email ||
          "Utilisateur";

        const user: UserWithRole = {
          id: String(dbUser.id),
          email: dbUser.email ?? undefined,
          name: displayName,
          role: (dbUser.role as RoleLiteral) ?? "USER",
        };

        return user;
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
    async signIn() {
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

    // ➜ Respecte callbackUrl (ex: /admin pour l’admin, /me pour un utilisateur)
    async redirect({ url, baseUrl }): Promise<string> {
      try {
        const u = new URL(url, baseUrl);
        const callbackUrl = u.searchParams.get("callbackUrl");

        if (callbackUrl) {
          // callbackUrl relatif
          if (callbackUrl.startsWith("/")) return `${baseUrl}${callbackUrl}`;

          // callbackUrl absolu mais même origine
          try {
            const absCb = new URL(callbackUrl);
            if (absCb.origin === baseUrl) return absCb.toString();
          } catch {
            /* ignore */
          }
        }
      } catch {
        /* ignore */
      }

      // URL relative -> même origine
      if (url.startsWith("/")) return `${baseUrl}${url}`;

      // URL absolue même origine
      try {
        const abs = new URL(url);
        if (abs.origin === baseUrl) return abs.toString();
      } catch {
        /* ignore */
      }

      // fallback sécurisé
      return baseUrl;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};
