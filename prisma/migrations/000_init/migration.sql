-- Extensions nécessaires (avant les index)
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."Click" (
    "id" BIGSERIAL NOT NULL,
    "offerId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "priceCentsAtClick" INTEGER NOT NULL,
    "subId" TEXT,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referrer" TEXT,
    CONSTRAINT "Click_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Merchant" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "network" TEXT,
    "programId" TEXT,
    "status" TEXT,
    CONSTRAINT "Merchant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Offer" (
    "id" SERIAL NOT NULL,
    "skuId" INTEGER NOT NULL,
    "merchantId" INTEGER NOT NULL,
    "affiliateUrl" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "shippingCents" INTEGER,
    "lastSeen" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Product" (
    "id" SERIAL NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "season" TEXT,
    "category" TEXT,
    "gtin" TEXT,
    "slug" TEXT NOT NULL,
    "attributes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,            -- ✅ ajouté pour coller au schema.prisma
    "fts" tsvector,                -- utilisé par la recherche (facultatif côté Prisma)
    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Sku" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "variant" TEXT,
    "gtin" TEXT,
    "attributes" JSONB,
    CONSTRAINT "Sku_pkey" PRIMARY KEY ("id")
);

-- Indexes (sans ASC/DESC sur GIN)
CREATE UNIQUE INDEX "Merchant_name_key" ON "public"."Merchant"("name");
CREATE UNIQUE INDEX "Merchant_slug_key" ON "public"."Merchant"("slug");

CREATE UNIQUE INDEX "Offer_skuId_merchantId_key" ON "public"."Offer"("skuId", "merchantId");

CREATE UNIQUE INDEX "Product_gtin_key" ON "public"."Product"("gtin");
CREATE UNIQUE INDEX "Product_slug_key" ON "public"."Product"("slug");

-- trigram + fts, sans ordre
CREATE INDEX "product_brand_trgm" ON "public"."Product" USING GIN ("brand" gin_trgm_ops);
CREATE INDEX "product_model_trgm" ON "public"."Product" USING GIN ("model" gin_trgm_ops);
CREATE INDEX "product_fts_gin"    ON "public"."Product" USING GIN ("fts");

CREATE UNIQUE INDEX "Sku_gtin_key" ON "public"."Sku"("gtin");

-- Foreign keys
ALTER TABLE "public"."Click"
  ADD CONSTRAINT "Click_offerId_fkey"   FOREIGN KEY ("offerId")   REFERENCES "public"."Offer"("id")   ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."Click"
  ADD CONSTRAINT "Click_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "public"."Offer"
  ADD CONSTRAINT "Offer_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "public"."Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."Offer"
  ADD CONSTRAINT "Offer_skuId_fkey"      FOREIGN KEY ("skuId")      REFERENCES "public"."Sku"("id")      ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "public"."Sku"
  ADD CONSTRAINT "Sku_productId_fkey"    FOREIGN KEY ("productId")  REFERENCES "public"."Product"("id")  ON DELETE RESTRICT ON UPDATE CASCADE;
