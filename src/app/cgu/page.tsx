import type { Metadata } from "next";
import { LegalPageType } from "@prisma/client";

import LegalPageView from "@/components/legal/LegalPageView";
import { getPublicLegalPage } from "@/lib/getPublicLegalPage";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublicLegalPage(LegalPageType.TERMS_OF_USE);

  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription || undefined,
  };
}

export default async function TermsOfUsePage() {
  const page = await getPublicLegalPage(LegalPageType.TERMS_OF_USE);

  return (
    <LegalPageView
      title={page.title}
      content={page.content}
      version={page.version}
      effectiveDate={page.effectiveDate}
      updatedAt={page.updatedAt}
    />
  );
}