/*
  Warnings:

  - The `status` column on the `ReturnRequest` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `resolution` column on the `ReturnRequest` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `refundAmount` on the `ReturnRequest` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - Changed the type of `reason` on the `ReturnRequest` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ReturnStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ReturnReason" AS ENUM ('DAMAGED', 'WRONG_ITEM', 'SIZE_ISSUE', 'NOT_AS_DESCRIBED', 'CHANGED_MIND');

-- CreateEnum
CREATE TYPE "Resolution" AS ENUM ('REFUND', 'REPLACEMENT', 'STORE_CREDIT');

-- AlterTable
ALTER TABLE "ReturnRequest" DROP COLUMN "reason",
ADD COLUMN     "reason" "ReturnReason" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "ReturnStatus" NOT NULL DEFAULT 'OPEN',
DROP COLUMN "resolution",
ADD COLUMN     "resolution" "Resolution",
ALTER COLUMN "refundAmount" SET DATA TYPE DECIMAL(10,2);

-- CreateTable
CREATE TABLE "Note" (
    "id" SERIAL NOT NULL,
    "returnRequestId" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Note_returnRequestId_createdAt_idx" ON "Note"("returnRequestId", "createdAt");

-- CreateIndex
CREATE INDEX "ReturnRequest_status_idx" ON "ReturnRequest"("status");

-- CreateIndex
CREATE INDEX "ReturnRequest_reason_idx" ON "ReturnRequest"("reason");

-- CreateIndex
CREATE INDEX "ReturnRequest_orderId_idx" ON "ReturnRequest"("orderId");

-- CreateIndex
CREATE INDEX "ReturnRequest_customerName_idx" ON "ReturnRequest"("customerName");

-- CreateIndex
CREATE INDEX "ReturnRequest_reference_idx" ON "ReturnRequest"("reference");

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_returnRequestId_fkey" FOREIGN KEY ("returnRequestId") REFERENCES "ReturnRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
