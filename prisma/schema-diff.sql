-- AlterTable
ALTER TABLE "FeedImport" ADD COLUMN     "deactivatedOffers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "deactivatedProducts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "deletedProducts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "feedKey" TEXT,
ADD COLUMN     "skippedRows" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sourceUrl" VARCHAR(2048);

-- AlterTable
ALTER TABLE "Offer" ADD COLUMN     "feedKey" TEXT,
ADD COLUMN     "sourceItemCount" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX "FeedImport_feedKey_idx" ON "FeedImport"("feedKey");

-- CreateIndex
CREATE INDEX "Offer_feedKey_idx" ON "Offer"("feedKey");

-- CreateIndex
CREATE INDEX "Offer_merchantId_feedKey_lastSeen_idx" ON "Offer"("merchantId", "feedKey", "lastSeen");
