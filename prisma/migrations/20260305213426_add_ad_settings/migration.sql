-- CreateTable
CREATE TABLE "AdSettings" (
    "id" SERIAL NOT NULL,
    "siteId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "adsenseClient" TEXT,
    "slotPageTop" TEXT,
    "slotPageInline" TEXT,
    "slotPageSidebar" TEXT,
    "slotPageBottom" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdSettings_siteId_key" ON "AdSettings"("siteId");

-- CreateIndex
CREATE INDEX "AdSettings_siteId_idx" ON "AdSettings"("siteId");
