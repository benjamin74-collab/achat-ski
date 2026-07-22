-- CreateEnum
CREATE TYPE "LegalPageType" AS ENUM ('LEGAL_NOTICE', 'PRIVACY_POLICY', 'COOKIE_POLICY', 'TERMS_OF_USE', 'CONTACT');

-- CreateTable
CREATE TABLE "LegalPage" (
    "id" SERIAL NOT NULL,
    "siteId" TEXT NOT NULL,
    "type" "LegalPageType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "version" TEXT,
    "effectiveDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalPage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LegalPage_siteId_idx" ON "LegalPage"("siteId");

-- CreateIndex
CREATE INDEX "LegalPage_siteId_published_idx" ON "LegalPage"("siteId", "published");

-- CreateIndex
CREATE UNIQUE INDEX "LegalPage_siteId_type_key" ON "LegalPage"("siteId", "type");
