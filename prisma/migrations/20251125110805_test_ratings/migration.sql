-- AlterTable
ALTER TABLE "EditorialTest" ADD COLUMN     "bannerId" INTEGER,
ADD COLUMN     "bannerUrl" TEXT,
ADD COLUMN     "content" TEXT;

-- CreateTable
CREATE TABLE "TestRatingCategory" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestRatingCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EditorialTestScore" (
    "testId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,

    CONSTRAINT "EditorialTestScore_pkey" PRIMARY KEY ("testId","categoryId")
);

-- CreateIndex
CREATE UNIQUE INDEX "TestRatingCategory_slug_key" ON "TestRatingCategory"("slug");

-- AddForeignKey
ALTER TABLE "EditorialTest" ADD CONSTRAINT "EditorialTest_bannerId_fkey" FOREIGN KEY ("bannerId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditorialTestScore" ADD CONSTRAINT "EditorialTestScore_testId_fkey" FOREIGN KEY ("testId") REFERENCES "EditorialTest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditorialTestScore" ADD CONSTRAINT "EditorialTestScore_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TestRatingCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
