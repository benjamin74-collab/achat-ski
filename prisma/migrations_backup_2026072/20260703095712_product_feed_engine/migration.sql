/*
  Warnings:

  - You are about to alter the column `affiliateUrl` on the `Offer` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(2048)`.
  - A unique constraint covering the columns `[merchantId,externalId]` on the table `Offer` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."Offer" DROP CONSTRAINT "Offer_skuId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Sku" DROP CONSTRAINT "Sku_productId_fkey";

-- AlterTable
ALTER TABLE "Merchant" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "websiteUrl" VARCHAR(512);

-- AlterTable
ALTER TABLE "Offer" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "availability" TEXT,
ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "imageUrl" VARCHAR(1024),
ADD COLUMN     "merchantProductUrl" VARCHAR(2048),
ADD COLUMN     "oldPriceCents" INTEGER,
ADD COLUMN     "parentExternalId" TEXT,
ALTER COLUMN "affiliateUrl" SET DATA TYPE VARCHAR(2048),
ALTER COLUMN "currency" SET DEFAULT 'EUR';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "imageUrl" VARCHAR(1024),
ADD COLUMN     "manufacturerReference" TEXT,
ADD COLUMN     "normalizedName" TEXT,
ADD COLUMN     "published" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Sku" ADD COLUMN     "color" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "manufacturerReference" TEXT,
ADD COLUMN     "merchantSku" TEXT,
ADD COLUMN     "normalizedVariant" TEXT,
ADD COLUMN     "size" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "PriceHistory" (
    "id" SERIAL NOT NULL,
    "offerId" INTEGER NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "oldPriceCents" INTEGER,
    "shippingCents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedImport" (
    "id" SERIAL NOT NULL,
    "merchantId" INTEGER NOT NULL,
    "platform" TEXT,
    "filename" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "importedRows" INTEGER NOT NULL DEFAULT 0,
    "createdProducts" INTEGER NOT NULL DEFAULT 0,
    "updatedProducts" INTEGER NOT NULL DEFAULT 0,
    "createdSkus" INTEGER NOT NULL DEFAULT 0,
    "updatedSkus" INTEGER NOT NULL DEFAULT 0,
    "createdOffers" INTEGER NOT NULL DEFAULT 0,
    "updatedOffers" INTEGER NOT NULL DEFAULT 0,
    "errorsCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawFeedProduct" (
    "id" SERIAL NOT NULL,
    "feedImportId" INTEGER NOT NULL,
    "merchantId" INTEGER NOT NULL,
    "externalId" TEXT,
    "parentExternalId" TEXT,
    "ean" TEXT,
    "manufacturerRef" TEXT,
    "title" TEXT,
    "brand" TEXT,
    "rawData" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "error" TEXT,
    "matchedProductId" INTEGER,
    "matchedSkuId" INTEGER,
    "matchedOfferId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RawFeedProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PriceHistory_offerId_idx" ON "PriceHistory"("offerId");

-- CreateIndex
CREATE INDEX "PriceHistory_recordedAt_idx" ON "PriceHistory"("recordedAt");

-- CreateIndex
CREATE INDEX "FeedImport_merchantId_idx" ON "FeedImport"("merchantId");

-- CreateIndex
CREATE INDEX "FeedImport_status_idx" ON "FeedImport"("status");

-- CreateIndex
CREATE INDEX "FeedImport_startedAt_idx" ON "FeedImport"("startedAt");

-- CreateIndex
CREATE INDEX "RawFeedProduct_feedImportId_idx" ON "RawFeedProduct"("feedImportId");

-- CreateIndex
CREATE INDEX "RawFeedProduct_merchantId_idx" ON "RawFeedProduct"("merchantId");

-- CreateIndex
CREATE INDEX "RawFeedProduct_ean_idx" ON "RawFeedProduct"("ean");

-- CreateIndex
CREATE INDEX "RawFeedProduct_manufacturerRef_idx" ON "RawFeedProduct"("manufacturerRef");

-- CreateIndex
CREATE INDEX "RawFeedProduct_externalId_idx" ON "RawFeedProduct"("externalId");

-- CreateIndex
CREATE INDEX "RawFeedProduct_processed_idx" ON "RawFeedProduct"("processed");

-- CreateIndex
CREATE INDEX "Offer_merchantId_idx" ON "Offer"("merchantId");

-- CreateIndex
CREATE INDEX "Offer_skuId_idx" ON "Offer"("skuId");

-- CreateIndex
CREATE INDEX "Offer_externalId_idx" ON "Offer"("externalId");

-- CreateIndex
CREATE INDEX "Offer_parentExternalId_idx" ON "Offer"("parentExternalId");

-- CreateIndex
CREATE INDEX "Offer_inStock_idx" ON "Offer"("inStock");

-- CreateIndex
CREATE INDEX "Offer_active_idx" ON "Offer"("active");

-- CreateIndex
CREATE INDEX "Offer_lastSeen_idx" ON "Offer"("lastSeen");

-- CreateIndex
CREATE UNIQUE INDEX "Offer_merchantId_externalId_key" ON "Offer"("merchantId", "externalId");

-- CreateIndex
CREATE INDEX "Product_normalizedName_idx" ON "Product"("normalizedName");

-- CreateIndex
CREATE INDEX "Product_manufacturerReference_idx" ON "Product"("manufacturerReference");

-- CreateIndex
CREATE INDEX "Product_published_idx" ON "Product"("published");

-- CreateIndex
CREATE INDEX "Product_active_idx" ON "Product"("active");

-- CreateIndex
CREATE INDEX "Sku_productId_idx" ON "Sku"("productId");

-- CreateIndex
CREATE INDEX "Sku_merchantSku_idx" ON "Sku"("merchantSku");

-- CreateIndex
CREATE INDEX "Sku_manufacturerReference_idx" ON "Sku"("manufacturerReference");

-- CreateIndex
CREATE INDEX "Sku_size_idx" ON "Sku"("size");

-- CreateIndex
CREATE INDEX "Sku_normalizedVariant_idx" ON "Sku"("normalizedVariant");

-- AddForeignKey
ALTER TABLE "Sku" ADD CONSTRAINT "Sku_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "Sku"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedImport" ADD CONSTRAINT "FeedImport_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RawFeedProduct" ADD CONSTRAINT "RawFeedProduct_feedImportId_fkey" FOREIGN KEY ("feedImportId") REFERENCES "FeedImport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
