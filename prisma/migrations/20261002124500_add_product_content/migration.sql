CREATE TYPE "ProductContentStatus" AS ENUM ('DRAFT', 'PUBLISHED');

CREATE TABLE "ProductContent" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "description" TEXT,
    "status" "ProductContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductContent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductContent_productId_key"
ON "ProductContent"("productId");

ALTER TABLE "ProductContent"
ADD CONSTRAINT "ProductContent_productId_fkey"
FOREIGN KEY ("productId")
REFERENCES "Product"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;