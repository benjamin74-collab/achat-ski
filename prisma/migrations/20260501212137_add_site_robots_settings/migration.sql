-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "robotsFollow" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "robotsIndex" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "robotsNoarchive" BOOLEAN NOT NULL DEFAULT false;
