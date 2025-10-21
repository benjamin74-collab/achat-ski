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
	  async signIn() {
		return true;
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

	  // ➜ Après /api/auth/signin, on va toujours vers /admin.
	  async redirect({ url, baseUrl }): Promise<string> {
		// cas retour depuis la page de login NextAuth ou racine
		const u = new URL(url, baseUrl);
		if (
		  u.pathname === "/" ||
		  u.pathname === "/api/auth/signin" ||
		  u.pathname.startsWith("/api/auth/signin")
		) {
		  return `${baseUrl}/admin`;
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
