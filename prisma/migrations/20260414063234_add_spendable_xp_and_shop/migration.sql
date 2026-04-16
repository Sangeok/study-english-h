-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "spendableXP" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "UserPurchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemCode" TEXT NOT NULL,
    "xpCost" INTEGER NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserPurchase_userId_purchasedAt_idx" ON "UserPurchase"("userId", "purchasedAt");

-- CreateIndex
CREATE INDEX "UserPurchase_userId_itemCode_idx" ON "UserPurchase"("userId", "itemCode");

-- AddForeignKey
ALTER TABLE "UserPurchase" ADD CONSTRAINT "UserPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
