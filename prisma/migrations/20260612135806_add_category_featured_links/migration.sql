-- CreateEnum
CREATE TYPE "FeaturedLinkType" AS ENUM ('GUIDE', 'BRAND');

-- CreateTable
CREATE TABLE "CategoryFeaturedLink" (
    "id" SERIAL NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "pageId" INTEGER,
    "brandId" INTEGER,
    "type" "FeaturedLinkType" NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoryFeaturedLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CategoryFeaturedLink_categoryId_idx" ON "CategoryFeaturedLink"("categoryId");

-- CreateIndex
CREATE INDEX "CategoryFeaturedLink_type_idx" ON "CategoryFeaturedLink"("type");

-- CreateIndex
CREATE INDEX "CategoryFeaturedLink_order_idx" ON "CategoryFeaturedLink"("order");

-- AddForeignKey
ALTER TABLE "CategoryFeaturedLink" ADD CONSTRAINT "CategoryFeaturedLink_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryFeaturedLink" ADD CONSTRAINT "CategoryFeaturedLink_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryFeaturedLink" ADD CONSTRAINT "CategoryFeaturedLink_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
