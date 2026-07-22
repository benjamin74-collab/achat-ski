-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" SERIAL NOT NULL,
    "siteId" TEXT NOT NULL,
    "name" TEXT,
    "tagline" TEXT,
    "logoSrc" TEXT,
    "logoAlt" TEXT,
    "faviconSrc" TEXT,
    "primary" TEXT NOT NULL,
    "secondary" TEXT NOT NULL,
    "accent" TEXT NOT NULL,
    "background" TEXT NOT NULL,
    "foreground" TEXT NOT NULL,
    "muted" TEXT NOT NULL,
    "mutedForeground" TEXT NOT NULL,
    "border" TEXT NOT NULL,
    "fontSans" TEXT NOT NULL,
    "fontDisplay" TEXT NOT NULL,
    "heroTitle" TEXT,
    "heroHighlight" TEXT,
    "heroSubtitle" TEXT,
    "heroCtas" JSONB,
    "showCategories" BOOLEAN NOT NULL DEFAULT true,
    "showLatestGuides" BOOLEAN NOT NULL DEFAULT true,
    "showTopBrands" BOOLEAN NOT NULL DEFAULT true,
    "categoryTiles" JSONB,
    "topBrands" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SiteSettings_siteId_key" ON "SiteSettings"("siteId");

-- CreateIndex
CREATE INDEX "SiteSettings_siteId_idx" ON "SiteSettings"("siteId");
