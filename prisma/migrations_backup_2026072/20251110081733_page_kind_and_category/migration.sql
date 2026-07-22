-- CreateEnum
CREATE TYPE "PageKind" AS ENUM ('GUIDE', 'COMPARATIF', 'ARTICLE');

-- AlterTable
ALTER TABLE "Page" ADD COLUMN     "categoryId" INTEGER,
ADD COLUMN     "kind" "PageKind" NOT NULL DEFAULT 'ARTICLE';

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
