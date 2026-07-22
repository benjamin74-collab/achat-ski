-- AlterTable
ALTER TABLE "Brand" ADD COLUMN     "bannerId" INTEGER,
ADD COLUMN     "bannerUrl" VARCHAR(512),
ADD COLUMN     "metaDescription" TEXT,
ADD COLUMN     "metaTitle" TEXT;

-- AddForeignKey
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_bannerId_fkey" FOREIGN KEY ("bannerId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
