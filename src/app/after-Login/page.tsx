// src/app/after-login/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AfterLoginPage() {
  const session = await getServerSession(authOptions);

  // non connecté → page d’accueil
  if (!session?.user) redirect("/");

  const role = session.user.role;
  redirect(role === "ADMIN" ? "/admin" : "/me");
}
