-- CreateEnum
CREATE TYPE "CookiePurpose" AS ENUM ('ESSENTIAL', 'ANALYTICS', 'ADS', 'PERSONALIZATION');

-- CreateEnum
CREATE TYPE "ConsentChoice" AS ENUM ('ESSENTIAL', 'ALL');

-- CreateTable
CREATE TABLE "CookieDefinition" (
    "id" SERIAL NOT NULL,
    "siteId" TEXT,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT,
    "purpose" "CookiePurpose" NOT NULL DEFAULT 'ESSENTIAL',
    "description" TEXT,
    "durationDays" INTEGER,
    "mandatory" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CookieDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CookieConsentLog" (
    "id" TEXT NOT NULL,
    "siteId" TEXT,
    "choice" "ConsentChoice" NOT NULL,
    "version" TEXT NOT NULL,
    "userAgent" TEXT,
    "path" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CookieConsentLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CookieDefinition_siteId_idx" ON "CookieDefinition"("siteId");

-- CreateIndex
CREATE INDEX "CookieDefinition_purpose_idx" ON "CookieDefinition"("purpose");

-- CreateIndex
CREATE UNIQUE INDEX "CookieDefinition_siteId_key_key" ON "CookieDefinition"("siteId", "key");

-- CreateIndex
CREATE INDEX "CookieConsentLog_siteId_idx" ON "CookieConsentLog"("siteId");

-- CreateIndex
CREATE INDEX "CookieConsentLog_createdAt_idx" ON "CookieConsentLog"("createdAt");
