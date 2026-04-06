-- AlterTable
ALTER TABLE "Page" ADD COLUMN     "guideCategoryId" INTEGER;

-- CreateTable
CREATE TABLE "GuideCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isInMenu" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuideCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GuideCategory_name_key" ON "GuideCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "GuideCategory_slug_key" ON "GuideCategory"("slug");

-- CreateIndex
CREATE INDEX "GuideCategory_order_idx" ON "GuideCategory"("order");

-- CreateIndex
CREATE INDEX "GuideCategory_active_isInMenu_idx" ON "GuideCategory"("active", "isInMenu");

-- CreateIndex
CREATE INDEX "GuideCategory_slug_idx" ON "GuideCategory"("slug");

-- CreateIndex
CREATE INDEX "Page_kind_published_idx" ON "Page"("kind", "published");

-- CreateIndex
CREATE INDEX "Page_guideCategoryId_idx" ON "Page"("guideCategoryId");

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_guideCategoryId_fkey" FOREIGN KEY ("guideCategoryId") REFERENCES "GuideCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
