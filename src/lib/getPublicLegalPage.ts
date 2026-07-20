import { LegalPageType } from "@prisma/client";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentSiteId } from "@/lib/currentSite";

export async function getPublicLegalPage(type: LegalPageType) {
  const siteId = await getCurrentSiteId();

  const page = await prisma.legalPage.findUnique({
    where: {
      siteId_type: {
        siteId,
        type,
      },
    },
  });

  if (!page || !page.published) {
    notFound();
  }

  return page;
}