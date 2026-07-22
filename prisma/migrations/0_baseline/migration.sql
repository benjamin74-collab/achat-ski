-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "PageKind" AS ENUM ('GUIDE', 'COMPARATIF', 'ARTICLE');

-- CreateEnum
CREATE TYPE "MerchantNetwork" AS ENUM ('KWANKO', 'AWIN', 'AFFILAE', 'DIRECT', 'OTHER');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('IMAGE');

-- CreateEnum
CREATE TYPE "CookiePurpose" AS ENUM ('ESSENTIAL', 'ANALYTICS', 'ADS', 'PERSONALIZATION');

-- CreateEnum
CREATE TYPE "ConsentChoice" AS ENUM ('ESSENTIAL', 'ALL');

-- CreateEnum
CREATE TYPE "AdPlacementType" AS ENUM ('ADSENSE', 'AFFILIATE_BANNER', 'CUSTOM_HTML');

-- CreateEnum
CREATE TYPE "FeaturedLinkType" AS ENUM ('GUIDE', 'BRAND');

-- CreateEnum
CREATE TYPE "LegalPageType" AS ENUM ('LEGAL_NOTICE', 'PRIVACY_POLICY', 'COOKIE_POLICY', 'TERMS_OF_USE', 'CONTACT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "siteId" TEXT,
    "avatarId" INTEGER,
    "pseudo" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "marketingOptIn" BOOLEAN NOT NULL DEFAULT false,
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailVerificationToken" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "websiteUrl" VARCHAR(512),
    "logoUrl" VARCHAR(512),
    "logoId" INTEGER,
    "bannerUrl" VARCHAR(512),
    "bannerId" INTEGER,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "showInFooter" BOOLEAN NOT NULL DEFAULT false,
    "footerOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "showOnHomepage" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "Page" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "intro" TEXT,
    "thumbnailUrl" TEXT,
    "thumbnailId" INTEGER,
    "bannerUrl" TEXT,
    "bannerId" INTEGER,
    "kind" "PageKind" NOT NULL DEFAULT 'ARTICLE',
    "categoryId" INTEGER,
    "guideCategoryId" INTEGER,
    "authorId" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "showInFooter" BOOLEAN NOT NULL DEFAULT false,
    "footerOrder" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[],

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageComment" (
    "id" SERIAL NOT NULL,
    "pageId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PageComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "brand" TEXT,
    "model" TEXT NOT NULL,
    "gtin" TEXT,
    "brandId" INTEGER,
    "season" TEXT,
    "categoryId" INTEGER,
    "slug" TEXT NOT NULL,
    "attributes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "normalizedName" TEXT,
    "manufacturerReference" TEXT,
    "imageUrl" VARCHAR(1024),
    "published" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sku" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "displayName" TEXT,
    "variant" TEXT,
    "gtin" TEXT,
    "attributes" JSONB,
    "merchantSku" TEXT,
    "manufacturerReference" TEXT,
    "size" TEXT,
    "color" TEXT,
    "gender" TEXT,
    "normalizedVariant" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sku_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Merchant" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "platform" "MerchantNetwork" NOT NULL DEFAULT 'OTHER',
    "network" TEXT,
    "programId" TEXT,
    "status" TEXT,
    "websiteUrl" VARCHAR(512),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Merchant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "merchantId" INTEGER NOT NULL,
    "affiliateUrl" VARCHAR(2048) NOT NULL,
    "merchantProductUrl" VARCHAR(2048),
    "externalId" TEXT,
    "parentExternalId" TEXT,
    "priceCents" INTEGER NOT NULL,
    "oldPriceCents" INTEGER,
    "shippingCents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "availability" TEXT,
    "imageUrl" VARCHAR(1024),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastSeen" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "feedKey" TEXT,
    "sourceItemCount" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceHistory" (
    "id" SERIAL NOT NULL,
    "offerId" INTEGER NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "oldPriceCents" INTEGER,
    "shippingCents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Click" (
    "id" BIGSERIAL NOT NULL,
    "offerId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "priceCentsAtClick" INTEGER NOT NULL,
    "subId" TEXT,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referrer" TEXT,

    CONSTRAINT "Click_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "userId" TEXT,
    "rating" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "authorName" TEXT,
    "sourceName" TEXT,
    "sourceUrl" TEXT,
    "status" "ModerationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EditorialTest" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "userId" TEXT,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT,
    "bannerUrl" TEXT,
    "bannerId" INTEGER,
    "score" DOUBLE PRECISION,
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "status" "ModerationStatus" NOT NULL DEFAULT 'PENDING',
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EditorialTest_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" INTEGER,
    "intro" TEXT,
    "content" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "thumbnailUrl" TEXT,
    "thumbnailId" INTEGER,
    "isInMenu" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "showInFooter" BOOLEAN NOT NULL DEFAULT false,
    "footerOrder" INTEGER NOT NULL DEFAULT 0,
    "mapKwanko" TEXT[],
    "mapEkosport" TEXT[],
    "mapSnowleader" TEXT[],
    "mapGlisshop" TEXT[],
    "aliases" TEXT[],
    "showOnHomepage" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedImport" (
    "id" SERIAL NOT NULL,
    "merchantId" INTEGER NOT NULL,
    "platform" TEXT,
    "filename" TEXT,
    "feedKey" TEXT,
    "sourceUrl" VARCHAR(2048),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "importedRows" INTEGER NOT NULL DEFAULT 0,
    "createdProducts" INTEGER NOT NULL DEFAULT 0,
    "updatedProducts" INTEGER NOT NULL DEFAULT 0,
    "createdSkus" INTEGER NOT NULL DEFAULT 0,
    "updatedSkus" INTEGER NOT NULL DEFAULT 0,
    "createdOffers" INTEGER NOT NULL DEFAULT 0,
    "updatedOffers" INTEGER NOT NULL DEFAULT 0,
    "skippedRows" INTEGER NOT NULL DEFAULT 0,
    "deactivatedOffers" INTEGER NOT NULL DEFAULT 0,
    "deactivatedProducts" INTEGER NOT NULL DEFAULT 0,
    "deletedProducts" INTEGER NOT NULL DEFAULT 0,
    "errorsCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawFeedProduct" (
    "id" SERIAL NOT NULL,
    "feedImportId" INTEGER NOT NULL,
    "merchantId" INTEGER NOT NULL,
    "externalId" TEXT,
    "parentExternalId" TEXT,
    "ean" TEXT,
    "manufacturerRef" TEXT,
    "title" TEXT,
    "brand" TEXT,
    "rawData" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "error" TEXT,
    "matchedProductId" INTEGER,
    "matchedSkuId" INTEGER,
    "matchedOfferId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RawFeedProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportRun" (
    "id" SERIAL NOT NULL,
    "source" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "offersUpserted" INTEGER NOT NULL DEFAULT 0,
    "offersDisabled" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "ImportRun_pkey" PRIMARY KEY ("id")
);

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
    "pagesContent" JSONB,
    "footerTrustTitle" TEXT,
    "footerTrustItems" JSONB,
    "footerCopyright" TEXT,
    "contentSettings" JSONB,
    "robotsIndex" BOOLEAN NOT NULL DEFAULT true,
    "robotsFollow" BOOLEAN NOT NULL DEFAULT true,
    "robotsNoarchive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT,
    "alt" TEXT,
    "kind" "MediaKind" NOT NULL DEFAULT 'IMAGE',
    "mime" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "bytes" INTEGER,
    "storageKey" TEXT NOT NULL,
    "publicUrl" VARCHAR(1024) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "AdPlacement" (
    "id" SERIAL NOT NULL,
    "siteId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "type" "AdPlacementType" NOT NULL DEFAULT 'ADSENSE',
    "adsenseSlot" TEXT,
    "customHtml" TEXT,
    "bannerImageUrl" TEXT,
    "bannerAlt" TEXT,
    "bannerLinkUrl" TEXT,
    "bannerTitle" TEXT,
    "openInNewTab" BOOLEAN NOT NULL DEFAULT true,
    "nofollow" BOOLEAN NOT NULL DEFAULT true,
    "sponsored" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdPlacement_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "CategoryFeaturedLink" (
    "id" SERIAL NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "pageId" INTEGER,
    "brandId" INTEGER,
    "type" "FeaturedLinkType" NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoryFeaturedLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalPage" (
    "id" SERIAL NOT NULL,
    "siteId" TEXT NOT NULL,
    "type" "LegalPageType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "version" TEXT,
    "effectiveDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalPage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_siteId_idx" ON "User"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerificationToken_token_key" ON "EmailVerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_name_key" ON "Brand"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_slug_key" ON "Brand"("slug");

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
CREATE UNIQUE INDEX "Page_slug_key" ON "Page"("slug");

-- CreateIndex
CREATE INDEX "Page_kind_published_idx" ON "Page"("kind", "published");

-- CreateIndex
CREATE INDEX "Page_guideCategoryId_idx" ON "Page"("guideCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_gtin_key" ON "Product"("gtin");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_brandId_idx" ON "Product"("brandId");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "Product_normalizedName_idx" ON "Product"("normalizedName");

-- CreateIndex
CREATE INDEX "Product_manufacturerReference_idx" ON "Product"("manufacturerReference");

-- CreateIndex
CREATE INDEX "Product_published_idx" ON "Product"("published");

-- CreateIndex
CREATE INDEX "Product_active_idx" ON "Product"("active");

-- CreateIndex
CREATE UNIQUE INDEX "Sku_gtin_key" ON "Sku"("gtin");

-- CreateIndex
CREATE INDEX "Sku_productId_idx" ON "Sku"("productId");

-- CreateIndex
CREATE INDEX "Sku_merchantSku_idx" ON "Sku"("merchantSku");

-- CreateIndex
CREATE INDEX "Sku_manufacturerReference_idx" ON "Sku"("manufacturerReference");

-- CreateIndex
CREATE INDEX "Sku_size_idx" ON "Sku"("size");

-- CreateIndex
CREATE INDEX "Sku_normalizedVariant_idx" ON "Sku"("normalizedVariant");

-- CreateIndex
CREATE UNIQUE INDEX "Merchant_name_key" ON "Merchant"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Merchant_slug_key" ON "Merchant"("slug");

-- CreateIndex
CREATE INDEX "Offer_productId_idx" ON "Offer"("productId");

-- CreateIndex
CREATE INDEX "Offer_merchantId_idx" ON "Offer"("merchantId");

-- CreateIndex
CREATE INDEX "Offer_externalId_idx" ON "Offer"("externalId");

-- CreateIndex
CREATE INDEX "Offer_parentExternalId_idx" ON "Offer"("parentExternalId");

-- CreateIndex
CREATE INDEX "Offer_inStock_idx" ON "Offer"("inStock");

-- CreateIndex
CREATE INDEX "Offer_active_idx" ON "Offer"("active");

-- CreateIndex
CREATE INDEX "Offer_lastSeen_idx" ON "Offer"("lastSeen");

-- CreateIndex
CREATE INDEX "Offer_feedKey_idx" ON "Offer"("feedKey");

-- CreateIndex
CREATE INDEX "Offer_merchantId_feedKey_lastSeen_idx" ON "Offer"("merchantId", "feedKey", "lastSeen");

-- CreateIndex
CREATE UNIQUE INDEX "Offer_productId_merchantId_key" ON "Offer"("productId", "merchantId");

-- CreateIndex
CREATE INDEX "PriceHistory_offerId_idx" ON "PriceHistory"("offerId");

-- CreateIndex
CREATE INDEX "PriceHistory_recordedAt_idx" ON "PriceHistory"("recordedAt");

-- CreateIndex
CREATE INDEX "Review_productId_idx" ON "Review"("productId");

-- CreateIndex
CREATE INDEX "Review_rating_idx" ON "Review"("rating");

-- CreateIndex
CREATE INDEX "Review_status_idx" ON "Review"("status");

-- CreateIndex
CREATE INDEX "EditorialTest_productId_idx" ON "EditorialTest"("productId");

-- CreateIndex
CREATE INDEX "EditorialTest_publishedAt_idx" ON "EditorialTest"("publishedAt");

-- CreateIndex
CREATE INDEX "EditorialTest_status_idx" ON "EditorialTest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TestRatingCategory_slug_key" ON "TestRatingCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_parentId_order_idx" ON "Category"("parentId", "order");

-- CreateIndex
CREATE INDEX "Category_slug_idx" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_published_idx" ON "Category"("published");

-- CreateIndex
CREATE INDEX "FeedImport_merchantId_idx" ON "FeedImport"("merchantId");

-- CreateIndex
CREATE INDEX "FeedImport_status_idx" ON "FeedImport"("status");

-- CreateIndex
CREATE INDEX "FeedImport_startedAt_idx" ON "FeedImport"("startedAt");

-- CreateIndex
CREATE INDEX "FeedImport_feedKey_idx" ON "FeedImport"("feedKey");

-- CreateIndex
CREATE INDEX "RawFeedProduct_feedImportId_idx" ON "RawFeedProduct"("feedImportId");

-- CreateIndex
CREATE INDEX "RawFeedProduct_merchantId_idx" ON "RawFeedProduct"("merchantId");

-- CreateIndex
CREATE INDEX "RawFeedProduct_ean_idx" ON "RawFeedProduct"("ean");

-- CreateIndex
CREATE INDEX "RawFeedProduct_manufacturerRef_idx" ON "RawFeedProduct"("manufacturerRef");

-- CreateIndex
CREATE INDEX "RawFeedProduct_externalId_idx" ON "RawFeedProduct"("externalId");

-- CreateIndex
CREATE INDEX "RawFeedProduct_processed_idx" ON "RawFeedProduct"("processed");

-- CreateIndex
CREATE UNIQUE INDEX "SiteSettings_siteId_key" ON "SiteSettings"("siteId");

-- CreateIndex
CREATE INDEX "SiteSettings_siteId_idx" ON "SiteSettings"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_slug_key" ON "MediaAsset"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_storageKey_key" ON "MediaAsset"("storageKey");

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

-- CreateIndex
CREATE UNIQUE INDEX "AdSettings_siteId_key" ON "AdSettings"("siteId");

-- CreateIndex
CREATE INDEX "AdSettings_siteId_idx" ON "AdSettings"("siteId");

-- CreateIndex
CREATE INDEX "AdPlacement_siteId_idx" ON "AdPlacement"("siteId");

-- CreateIndex
CREATE INDEX "AdPlacement_key_idx" ON "AdPlacement"("key");

-- CreateIndex
CREATE UNIQUE INDEX "AdPlacement_siteId_key_key" ON "AdPlacement"("siteId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "TrackingSettings_siteId_key" ON "TrackingSettings"("siteId");

-- CreateIndex
CREATE INDEX "TrackingSettings_siteId_idx" ON "TrackingSettings"("siteId");

-- CreateIndex
CREATE INDEX "CategoryFeaturedLink_categoryId_idx" ON "CategoryFeaturedLink"("categoryId");

-- CreateIndex
CREATE INDEX "CategoryFeaturedLink_type_idx" ON "CategoryFeaturedLink"("type");

-- CreateIndex
CREATE INDEX "CategoryFeaturedLink_order_idx" ON "CategoryFeaturedLink"("order");

-- CreateIndex
CREATE INDEX "LegalPage_siteId_idx" ON "LegalPage"("siteId");

-- CreateIndex
CREATE INDEX "LegalPage_siteId_published_idx" ON "LegalPage"("siteId", "published");

-- CreateIndex
CREATE UNIQUE INDEX "LegalPage_siteId_type_key" ON "LegalPage"("siteId", "type");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_avatarId_fkey" FOREIGN KEY ("avatarId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_logoId_fkey" FOREIGN KEY ("logoId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_bannerId_fkey" FOREIGN KEY ("bannerId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_thumbnailId_fkey" FOREIGN KEY ("thumbnailId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_bannerId_fkey" FOREIGN KEY ("bannerId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_guideCategoryId_fkey" FOREIGN KEY ("guideCategoryId") REFERENCES "GuideCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageComment" ADD CONSTRAINT "PageComment_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageComment" ADD CONSTRAINT "PageComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sku" ADD CONSTRAINT "Sku_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Click" ADD CONSTRAINT "Click_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Click" ADD CONSTRAINT "Click_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditorialTest" ADD CONSTRAINT "EditorialTest_bannerId_fkey" FOREIGN KEY ("bannerId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditorialTest" ADD CONSTRAINT "EditorialTest_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditorialTest" ADD CONSTRAINT "EditorialTest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditorialTestScore" ADD CONSTRAINT "EditorialTestScore_testId_fkey" FOREIGN KEY ("testId") REFERENCES "EditorialTest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditorialTestScore" ADD CONSTRAINT "EditorialTestScore_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TestRatingCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_thumbnailId_fkey" FOREIGN KEY ("thumbnailId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedImport" ADD CONSTRAINT "FeedImport_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RawFeedProduct" ADD CONSTRAINT "RawFeedProduct_feedImportId_fkey" FOREIGN KEY ("feedImportId") REFERENCES "FeedImport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryFeaturedLink" ADD CONSTRAINT "CategoryFeaturedLink_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryFeaturedLink" ADD CONSTRAINT "CategoryFeaturedLink_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryFeaturedLink" ADD CONSTRAINT "CategoryFeaturedLink_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

