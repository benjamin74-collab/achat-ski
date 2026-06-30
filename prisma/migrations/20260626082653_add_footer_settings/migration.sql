-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "footerColumns" JSONB,
ADD COLUMN     "footerCopyright" TEXT,
ADD COLUMN     "footerExplorerColumns" JSONB,
ADD COLUMN     "footerExplorerTitle" TEXT,
ADD COLUMN     "footerLegalLinks" JSONB,
ADD COLUMN     "footerTrustItems" JSONB,
ADD COLUMN     "footerTrustTitle" TEXT;
