-- AlterEnum
ALTER TYPE "AdPlacementType" ADD VALUE 'CUSTOM_HTML';

-- AlterTable
ALTER TABLE "AdPlacement" ADD COLUMN     "customHtml" TEXT;
