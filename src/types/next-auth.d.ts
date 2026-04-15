// src/types/next-auth.d.ts
import { type DefaultSession } from "next-auth";

declare module "next-auth" {
  type AppRole = "ADMIN" | "USER";

  interface User {
    id: string;
    role: AppRole;
    siteId?: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: AppRole;
      siteId?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  type AppRole = "ADMIN" | "USER";

  interface JWT {
    id?: string;
    role?: AppRole;
    siteId?: string | null;
  }
}