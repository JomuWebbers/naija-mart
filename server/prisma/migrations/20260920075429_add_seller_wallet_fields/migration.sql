-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accountBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "isTrustedVendor" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "linkedBankAccountNumber" TEXT,
ADD COLUMN     "linkedBankName" TEXT,
ADD COLUMN     "trustedVendorRequestStatus" TEXT DEFAULT 'none';
