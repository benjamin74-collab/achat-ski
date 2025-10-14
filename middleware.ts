// middleware.ts
export { default } from "next-auth/middleware";

// Protège l’espace admin par authentification (on vérifiera le role en page)
export const config = {
  matcher: ["/admin/:path*"],
};
