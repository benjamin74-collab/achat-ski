/*
  Warnings:

  - You are about to drop the column `footerColumns` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `footerExplorerColumns` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `footerExplorerTitle` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `footerLegalLinks` on the `SiteSettings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Brand" ADD COLUMN     "footerOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "showInFooter" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "footerOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "showInFooter" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Page" ADD COLUMN     "footerOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "showInFooter" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "SiteSettings" DROP COLUMN "footerColumns",
DROP COLUMN "footerExplorerColumns",
DROP COLUMN "footerExplorerTitle",
DROP COLUMN "footerLegalLinks";
