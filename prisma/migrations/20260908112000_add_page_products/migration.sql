-- CreateTable
CREATE TABLE "PageProduct" (
    "id" SERIAL NOT NULL,
    "pageId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "label" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PageProduct_pageId_position_idx"
ON "PageProduct"("pageId", "position");

-- CreateIndex
CREATE INDEX "PageProduct_productId_idx"
ON "PageProduct"("productId");

-- CreateIndex
CREATE INDEX "PageProduct_pageId_featured_idx"
ON "PageProduct"("pageId", "featured");

-- CreateIndex
CREATE UNIQUE INDEX "PageProduct_pageId_productId_key"
ON "PageProduct"("pageId", "productId");

-- AddForeignKey
ALTER TABLE "PageProduct"
ADD CONSTRAINT "PageProduct_pageId_fkey"
FOREIGN KEY ("pageId") REFERENCES "Page"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageProduct"
ADD CONSTRAINT "PageProduct_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id")
ON DELETE CASCADE ON UPDATE CASCADE;