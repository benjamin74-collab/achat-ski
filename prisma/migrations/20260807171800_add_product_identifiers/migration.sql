DO $$
BEGIN
  CREATE TYPE "ProductIdentifierType" AS ENUM (
    'GTIN',
    'STYLE_CODE',
    'MANUFACTURER_REFERENCE',
    'MERCHANT_PARENT_ID',
    'SOURCE_GROUP_KEY'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "ProductIdentifier" (
  "id" SERIAL NOT NULL,
  "productId" INTEGER NOT NULL,
  "siteId" TEXT NOT NULL,
  "type" "ProductIdentifierType" NOT NULL,
  "value" TEXT NOT NULL,
  "brandKey" TEXT NOT NULL DEFAULT '',
  "merchantSlug" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProductIdentifier_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  ALTER TABLE "ProductIdentifier"
  ADD CONSTRAINT "ProductIdentifier_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "ProductIdentifier_siteId_type_value_brandKey_merchantSlug_key"
ON "ProductIdentifier"("siteId", "type", "value", "brandKey", "merchantSlug");

CREATE INDEX IF NOT EXISTS "ProductIdentifier_productId_idx"
ON "ProductIdentifier"("productId");

CREATE INDEX IF NOT EXISTS "ProductIdentifier_siteId_type_value_idx"
ON "ProductIdentifier"("siteId", "type", "value");

CREATE INDEX IF NOT EXISTS "ProductIdentifier_siteId_type_brandKey_value_idx"
ON "ProductIdentifier"("siteId", "type", "brandKey", "value");

CREATE INDEX IF NOT EXISTS "ProductIdentifier_siteId_type_merchantSlug_value_idx"
ON "ProductIdentifier"("siteId", "type", "merchantSlug", "value");