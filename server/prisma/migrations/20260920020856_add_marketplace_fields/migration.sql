/*
  Warnings:

  - Added the required column `sellerId` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "chargesDeliveryFee" BOOLEAN DEFAULT false,
ADD COLUMN     "deliveryDays" INTEGER,
ADD COLUMN     "deliveryFeeAmount" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "fulfillmentMethod" TEXT DEFAULT 'dropoff',
ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "listingFeeAmount" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "listingFeePaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "negotiable" TEXT DEFAULT 'no',
ADD COLUMN     "sellerAddress" TEXT,
ADD COLUMN     "sellerId" TEXT NOT NULL,
ADD COLUMN     "sellerLga" TEXT,
ADD COLUMN     "sellerState" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "subcategory" TEXT DEFAULT '';

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
