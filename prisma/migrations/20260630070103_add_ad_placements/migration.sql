-- CreateEnum
CREATE TYPE "AdPlacementType" AS ENUM ('ADSENSE', 'AFFILIATE_BANNER');

-- CreateTable
CREATE TABLE "AdPlacement" (
    "id" SERIAL NOT NULL,
    "siteId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "type" "AdPlacementType" NOT NULL DEFAULT 'ADSENSE',
    "adsenseSlot" TEXT,
    "bannerImageUrl" TEXT,
    "bannerAlt" TEXT,
    "bannerLinkUrl" TEXT,
    "bannerTitle" TEXT,
    "openInNewTab" BOOLEAN NOT NULL DEFAULT true,
    "nofollow" BOOLEAN NOT NULL DEFAULT true,
    "sponsored" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdPlacement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdPlacement_siteId_idx" ON "AdPlacement"("siteId");

-- CreateIndex
CREATE INDEX "AdPlacement_key_idx" ON "AdPlacement"("key");

-- CreateIndex
CREATE UNIQUE INDEX "AdPlacement_siteId_key_key" ON "AdPlacement"("siteId", "key");
