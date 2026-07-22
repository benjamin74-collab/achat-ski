/*
  Warnings:

  - You are about to drop the column `skuId` on the `Offer` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[productId,merchantId]` on the table `Offer` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `productId` to the `Offer` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Offer" DROP CONSTRAINT "Offer_skuId_fkey";

-- DropIndex
DROP INDEX "public"."Offer_merchantId_externalId_key";

-- DropIndex
DROP INDEX "public"."Offer_skuId_idx";

-- DropIndex
DROP INDEX "public"."Offer_skuId_merchantId_key";

-- AlterTable
ALTER TABLE "Offer" DROP COLUMN "skuId",
ADD COLUMN     "productId" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "Offer_productId_idx" ON "Offer"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Offer_productId_merchantId_key" ON "Offer"("productId", "merchantId");

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
