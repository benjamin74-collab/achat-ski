-- DropIndex
DROP INDEX "public"."Category_parentId_sortOrder_idx";

-- AlterTable
ALTER TABLE "Category" DROP COLUMN "isNav",
DROP COLUMN "sortOrder",
ADD COLUMN     "aliases" TEXT[],
ADD COLUMN     "isInMenu" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "mapEkosport" TEXT[],
ADD COLUMN     "mapGlisshop" TEXT[],
ADD COLUMN     "mapKwanko" TEXT[],
ADD COLUMN     "mapSnowleader" TEXT[],
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "category",
ADD COLUMN     "categoryId" INTEGER;

-- CreateIndex
CREATE INDEX "Category_parentId_order_idx" ON "Category"("parentId", "order");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

