-- CreateEnum
CREATE TYPE "FeedFormat" AS ENUM ('CSV', 'TSV', 'XML', 'JSON');

-- CreateEnum
CREATE TYPE "FeedFrequency" AS ENUM ('MANUAL_ONLY', 'EVERY_6_HOURS', 'EVERY_12_HOURS', 'DAILY', 'WEEKLY');

-- CreateEnum
CREATE TYPE "FeedImportStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'PARTIAL', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FeedImportTrigger" AS ENUM ('MANUAL', 'CRON', 'API', 'RETRY');

-- AlterTable
ALTER TABLE "FeedImport" ADD COLUMN     "durationMs" INTEGER,
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "feedSourceId" INTEGER,
ADD COLUMN     "restoredOffers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "restoredProducts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "siteId" TEXT,
ADD COLUMN     "statusV2" "FeedImportStatus",
ADD COLUMN     "trigger" "FeedImportTrigger" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "unchangedOffers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "unchangedProducts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "warningsCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Offer" ADD COLUMN     "affiliateProgramId" INTEGER,
ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "feedSourceId" INTEGER;

-- CreateTable
CREATE TABLE "AffiliateNetwork" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "websiteUrl" VARCHAR(512),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateNetwork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateProgram" (
    "id" SERIAL NOT NULL,
    "siteId" TEXT NOT NULL,
    "merchantId" INTEGER NOT NULL,
    "networkId" INTEGER NOT NULL,
    "name" TEXT,
    "externalProgramId" TEXT,
    "trackingId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedSource" (
    "id" SERIAL NOT NULL,
    "siteId" TEXT NOT NULL,
    "affiliateProgramId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sourceUrl" VARCHAR(2048) NOT NULL,
    "format" "FeedFormat" NOT NULL DEFAULT 'CSV',
    "delimiter" TEXT NOT NULL DEFAULT ';',
    "encoding" TEXT NOT NULL DEFAULT 'utf-8',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "autoImport" BOOLEAN NOT NULL DEFAULT false,
    "frequency" "FeedFrequency" NOT NULL DEFAULT 'MANUAL_ONLY',
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Paris',
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "lastSuccessAt" TIMESTAMP(3),
    "lastFailureAt" TIMESTAMP(3),
    "lastStatus" "FeedImportStatus",
    "lastErrorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedColumnMapping" (
    "id" SERIAL NOT NULL,
    "feedSourceId" INTEGER NOT NULL,
    "targetField" TEXT NOT NULL,
    "sourceColumn" TEXT NOT NULL,
    "fallbackColumns" TEXT[],
    "required" BOOLEAN NOT NULL DEFAULT false,
    "defaultValue" TEXT,
    "transform" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedColumnMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryExternalMapping" (
    "id" SERIAL NOT NULL,
    "feedSourceId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "externalPath" TEXT NOT NULL,
    "normalizedExternalPath" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoryExternalMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteProduct" (
    "id" SERIAL NOT NULL,
    "siteId" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateNetwork_slug_key" ON "AffiliateNetwork"("slug");

-- CreateIndex
CREATE INDEX "AffiliateNetwork_active_idx" ON "AffiliateNetwork"("active");

-- CreateIndex
CREATE INDEX "AffiliateProgram_siteId_idx" ON "AffiliateProgram"("siteId");

-- CreateIndex
CREATE INDEX "AffiliateProgram_merchantId_idx" ON "AffiliateProgram"("merchantId");

-- CreateIndex
CREATE INDEX "AffiliateProgram_networkId_idx" ON "AffiliateProgram"("networkId");

-- CreateIndex
CREATE INDEX "AffiliateProgram_active_idx" ON "AffiliateProgram"("active");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateProgram_siteId_merchantId_networkId_key" ON "AffiliateProgram"("siteId", "merchantId", "networkId");

-- CreateIndex
CREATE INDEX "FeedSource_siteId_idx" ON "FeedSource"("siteId");

-- CreateIndex
CREATE INDEX "FeedSource_affiliateProgramId_idx" ON "FeedSource"("affiliateProgramId");

-- CreateIndex
CREATE INDEX "FeedSource_active_autoImport_idx" ON "FeedSource"("active", "autoImport");

-- CreateIndex
CREATE INDEX "FeedSource_nextRunAt_idx" ON "FeedSource"("nextRunAt");

-- CreateIndex
CREATE UNIQUE INDEX "FeedSource_siteId_slug_key" ON "FeedSource"("siteId", "slug");

-- CreateIndex
CREATE INDEX "FeedColumnMapping_feedSourceId_idx" ON "FeedColumnMapping"("feedSourceId");

-- CreateIndex
CREATE INDEX "FeedColumnMapping_targetField_idx" ON "FeedColumnMapping"("targetField");

-- CreateIndex
CREATE UNIQUE INDEX "FeedColumnMapping_feedSourceId_targetField_key" ON "FeedColumnMapping"("feedSourceId", "targetField");

-- CreateIndex
CREATE INDEX "CategoryExternalMapping_feedSourceId_idx" ON "CategoryExternalMapping"("feedSourceId");

-- CreateIndex
CREATE INDEX "CategoryExternalMapping_categoryId_idx" ON "CategoryExternalMapping"("categoryId");

-- CreateIndex
CREATE INDEX "CategoryExternalMapping_active_idx" ON "CategoryExternalMapping"("active");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryExternalMapping_feedSourceId_normalizedExternalPath_key" ON "CategoryExternalMapping"("feedSourceId", "normalizedExternalPath", "categoryId");

-- CreateIndex
CREATE INDEX "SiteProduct_siteId_published_idx" ON "SiteProduct"("siteId", "published");

-- CreateIndex
CREATE INDEX "SiteProduct_siteId_active_idx" ON "SiteProduct"("siteId", "active");

-- CreateIndex
CREATE INDEX "SiteProduct_productId_idx" ON "SiteProduct"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "SiteProduct_siteId_productId_key" ON "SiteProduct"("siteId", "productId");

-- CreateIndex
CREATE INDEX "FeedImport_feedSourceId_idx" ON "FeedImport"("feedSourceId");

-- CreateIndex
CREATE INDEX "FeedImport_siteId_idx" ON "FeedImport"("siteId");

-- CreateIndex
CREATE INDEX "FeedImport_statusV2_idx" ON "FeedImport"("statusV2");

-- CreateIndex
CREATE INDEX "Offer_affiliateProgramId_idx" ON "Offer"("affiliateProgramId");

-- CreateIndex
CREATE INDEX "Offer_feedSourceId_idx" ON "Offer"("feedSourceId");

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_affiliateProgramId_fkey" FOREIGN KEY ("affiliateProgramId") REFERENCES "AffiliateProgram"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_feedSourceId_fkey" FOREIGN KEY ("feedSourceId") REFERENCES "FeedSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateProgram" ADD CONSTRAINT "AffiliateProgram_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateProgram" ADD CONSTRAINT "AffiliateProgram_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "AffiliateNetwork"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedSource" ADD CONSTRAINT "FeedSource_affiliateProgramId_fkey" FOREIGN KEY ("affiliateProgramId") REFERENCES "AffiliateProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedColumnMapping" ADD CONSTRAINT "FeedColumnMapping_feedSourceId_fkey" FOREIGN KEY ("feedSourceId") REFERENCES "FeedSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryExternalMapping" ADD CONSTRAINT "CategoryExternalMapping_feedSourceId_fkey" FOREIGN KEY ("feedSourceId") REFERENCES "FeedSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryExternalMapping" ADD CONSTRAINT "CategoryExternalMapping_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteProduct" ADD CONSTRAINT "SiteProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedImport" ADD CONSTRAINT "FeedImport_feedSourceId_fkey" FOREIGN KEY ("feedSourceId") REFERENCES "FeedSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
