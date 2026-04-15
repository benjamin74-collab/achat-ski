// src/lib/auth.ts
import type { NextAuthOptions, Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

type RoleLiteral = "ADMIN" | "USER";
type UserWithRoleSite = User & { role?: RoleLiteral; siteId?: string | null };
type JwtWithRoleSite = JWT & { id?: string; role?: RoleLiteral; siteId?: string | null };

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },

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

        const dbUser = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            siteId: true,
            passwordHash: true,
            pseudo: true,
            firstName: true,
            lastName: true,
          },
        });

        if (!dbUser || !dbUser.passwordHash) return null;

        const ok = await bcrypt.compare(pass, dbUser.passwordHash);
        if (!ok) return null;

        const displayName =
          dbUser.pseudo ||
          [dbUser.firstName, dbUser.lastName].filter(Boolean).join(" ") ||
          dbUser.name ||
          dbUser.email ||
          "Utilisateur";

        const user: UserWithRoleSite = {
          id: String(dbUser.id),
          email: dbUser.email ?? undefined,
          name: displayName,
          role: (dbUser.role as RoleLiteral) ?? "USER",
          siteId: dbUser.siteId ?? null,
        };

        return user;
      },
    }),

    ...(process.env.GITHUB_ID && process.env.GITHUB_SECRET
      ? [
          GitHub({
            clientId: process.env.GITHUB_ID,
            clientSecret: process.env.GITHUB_SECRET,
            allowDangerousEmailAccountLinking: true,
            profile(profile): User {
              const u: UserWithRoleSite = {
                id: String(profile.id),
                name: profile.name ?? profile.login,
                email: profile.email ?? undefined,
                role: "USER",
                siteId: null,
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
      const typedToken = token as JwtWithRoleSite;

      if (user) {
        const typedUser = user as UserWithRoleSite;
        typedToken.id = typedUser.id;
        typedToken.role = typedUser.role ?? "USER";
        typedToken.siteId = typedUser.siteId ?? null;
      }

      return typedToken;
    },

    async session({ session, token }): Promise<Session> {
      const typedToken = token as JwtWithRoleSite;

      if (session.user) {
        (
          session.user as typeof session.user & {
            id: string;
            role: RoleLiteral;
            siteId: string | null;
          }
        ).id = typedToken.id ?? "";

        (
          session.user as typeof session.user & {
            id: string;
            role: RoleLiteral;
            siteId: string | null;
          }
        ).role = (typedToken.role ?? "USER") as RoleLiteral;

        (
          session.user as typeof session.user & {
            id: string;
            role: RoleLiteral;
            siteId: string | null;
          }
        ).siteId = typedToken.siteId ?? null;
      }

      return session;
    },

    async redirect({ url, baseUrl }): Promise<string> {
      try {
        const u = new URL(url, baseUrl);
        const callbackUrl = u.searchParams.get("callbackUrl");

        if (callbackUrl) {
          if (callbackUrl.startsWith("/")) return `${baseUrl}${callbackUrl}`;

          try {
            const absCb = new URL(callbackUrl);
            if (absCb.origin === baseUrl) return absCb.toString();
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore
      }

      if (url.startsWith("/")) return `${baseUrl}${url}`;

      try {
        const abs = new URL(url);
        if (abs.origin === baseUrl) return abs.toString();
      } catch {
        // ignore
      }

      return baseUrl;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};