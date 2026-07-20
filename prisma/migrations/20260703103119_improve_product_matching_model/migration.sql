-- CreateEnum
CREATE TYPE "MerchantNetwork" AS ENUM ('KWANKO', 'AWIN', 'AFFILAE', 'DIRECT', 'OTHER');

-- AlterTable
ALTER TABLE "Merchant" ADD COLUMN     "platform" "MerchantNetwork" NOT NULL DEFAULT 'OTHER';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "name" TEXT;

-- AlterTable
ALTER TABLE "Sku" ADD COLUMN     "displayName" TEXT;
