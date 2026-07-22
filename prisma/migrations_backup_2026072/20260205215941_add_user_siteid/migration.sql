-- AlterTable
ALTER TABLE "User" ADD COLUMN     "siteId" TEXT;

-- CreateIndex
CREATE INDEX "User_siteId_idx" ON "User"("siteId");
