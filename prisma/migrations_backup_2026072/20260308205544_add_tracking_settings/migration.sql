-- CreateTable
CREATE TABLE "TrackingSettings" (
    "id" SERIAL NOT NULL,
    "siteId" TEXT NOT NULL,
    "enabledAnalytics" BOOLEAN NOT NULL DEFAULT false,
    "enabledAds" BOOLEAN NOT NULL DEFAULT false,
    "enabledGtm" BOOLEAN NOT NULL DEFAULT false,
    "ga4MeasurementId" TEXT,
    "googleAdsId" TEXT,
    "googleAdsConversionLabel" TEXT,
    "gtmContainerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrackingSettings_siteId_key" ON "TrackingSettings"("siteId");

-- CreateIndex
CREATE INDEX "TrackingSettings_siteId_idx" ON "TrackingSettings"("siteId");
