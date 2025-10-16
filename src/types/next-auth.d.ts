// src/types/next-auth.d.ts
import { type DefaultSession } from "next-auth";

declare module "next-auth" {
  /** Rôles app (on reste en littéraux pour ne pas lier ce fichier au client Prisma) */
  type AppRole = "ADMIN" | "USER";

  interface User {
    id: string;
    role: AppRole;
  }

  interface Session {
    user: {
      id: string;
      role: AppRole;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  type AppRole = "ADMIN" | "USER";
  interface JWT {
    id?: string;
    role?: AppRole;
  }
}
