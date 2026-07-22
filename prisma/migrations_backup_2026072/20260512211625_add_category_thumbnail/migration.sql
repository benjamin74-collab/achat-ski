-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "thumbnailId" INTEGER,
ADD COLUMN     "thumbnailUrl" TEXT;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_thumbnailId_fkey" FOREIGN KEY ("thumbnailId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
