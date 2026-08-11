DO $$
BEGIN
  CREATE TYPE "FeedImportMode" AS ENUM ('FULL', 'DELTA');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "FeedSource"
ADD COLUMN IF NOT EXISTS "lastContentHash" VARCHAR(64);

ALTER TABLE "FeedSource"
ADD COLUMN IF NOT EXISTS "lastContentHashAt" TIMESTAMP(3);

ALTER TABLE "FeedImport"
ADD COLUMN IF NOT EXISTS "mode" "FeedImportMode" NOT NULL DEFAULT 'FULL';

ALTER TABLE "FeedImport"
ADD COLUMN IF NOT EXISTS "contentHash" VARCHAR(64);

ALTER TABLE "Offer"
ADD COLUMN IF NOT EXISTS "sourceGroupKey" VARCHAR(512);

ALTER TABLE "Offer"
ADD COLUMN IF NOT EXISTS "sourceProductHash" VARCHAR(64);

ALTER TABLE "Offer"
ADD COLUMN IF NOT EXISTS "sourceOfferHash" VARCHAR(64);

ALTER TABLE "Offer"
ADD COLUMN IF NOT EXISTS "sourceHashVersion" INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS "FeedImport_mode_idx"
ON "FeedImport"("mode");

CREATE INDEX IF NOT EXISTS "FeedImport_contentHash_idx"
ON "FeedImport"("contentHash");

CREATE INDEX IF NOT EXISTS "Offer_merchantId_feedKey_sourceGroupKey_idx"
ON "Offer"("merchantId", "feedKey", "sourceGroupKey");

CREATE INDEX IF NOT EXISTS "Offer_merchantId_feedKey_sourceProductHash_idx"
ON "Offer"("merchantId", "feedKey", "sourceProductHash");

CREATE INDEX IF NOT EXISTS "Offer_merchantId_feedKey_sourceOfferHash_idx"
ON "Offer"("merchantId", "feedKey", "sourceOfferHash");