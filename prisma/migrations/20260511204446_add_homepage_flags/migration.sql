-- AlterTable
ALTER TABLE "Brand" ADD COLUMN     "showOnHomepage" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "showOnHomepage" BOOLEAN NOT NULL DEFAULT false;
