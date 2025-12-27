// src/components/Providers.tsx
"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";

export default function Providers({ children }: { children: ReactNode }) {
  // Tu pourras ajouter d'autres providers ici (ex: QueryClientProvider, ThemeProvider, etc.)
  return <SessionProvider>{children}</SessionProvider>;
}
