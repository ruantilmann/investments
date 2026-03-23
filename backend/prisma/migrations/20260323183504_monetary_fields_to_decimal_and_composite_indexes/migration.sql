/*
  Warnings:

  - You are about to alter the column `currentAmount` on the `investments` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `initialAmount` on the `investments` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `yieldAmount` on the `investments` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `balance` on the `wallets` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `grossAmount` on the `withdraws` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `netAmount` on the `withdraws` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `profitAmount` on the `withdraws` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `taxAmount` on the `withdraws` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_investments" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "walletId" INTEGER NOT NULL,
    "ownerName" TEXT NOT NULL,
    "initialAmount" DECIMAL NOT NULL,
    "currentAmount" DECIMAL NOT NULL,
    "yieldAmount" DECIMAL NOT NULL DEFAULT 0,
    "investedAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "withdrawnAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "investments_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_investments" ("createdAt", "currentAmount", "id", "initialAmount", "investedAt", "ownerName", "status", "updatedAt", "walletId", "withdrawnAt", "yieldAmount") SELECT "createdAt", "currentAmount", "id", "initialAmount", "investedAt", "ownerName", "status", "updatedAt", "walletId", "withdrawnAt", "yieldAmount" FROM "investments";
DROP TABLE "investments";
ALTER TABLE "new_investments" RENAME TO "investments";
CREATE INDEX "investments_walletId_idx" ON "investments"("walletId");
CREATE INDEX "investments_status_idx" ON "investments"("status");
CREATE INDEX "investments_walletId_status_idx" ON "investments"("walletId", "status");
CREATE TABLE "new_wallets" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "balance" DECIMAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_wallets" ("balance", "createdAt", "id", "updatedAt", "userId") SELECT "balance", "createdAt", "id", "updatedAt", "userId" FROM "wallets";
DROP TABLE "wallets";
ALTER TABLE "new_wallets" RENAME TO "wallets";
CREATE UNIQUE INDEX "wallets_userId_key" ON "wallets"("userId");
CREATE TABLE "new_withdraws" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "investmentId" INTEGER NOT NULL,
    "grossAmount" DECIMAL NOT NULL,
    "taxAmount" DECIMAL NOT NULL DEFAULT 0,
    "netAmount" DECIMAL NOT NULL,
    "profitAmount" DECIMAL NOT NULL DEFAULT 0,
    "withdrawDate" DATETIME NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "withdraws_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "investments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_withdraws" ("createdAt", "grossAmount", "id", "investmentId", "netAmount", "notes", "profitAmount", "taxAmount", "withdrawDate") SELECT "createdAt", "grossAmount", "id", "investmentId", "netAmount", "notes", "profitAmount", "taxAmount", "withdrawDate" FROM "withdraws";
DROP TABLE "withdraws";
ALTER TABLE "new_withdraws" RENAME TO "withdraws";
CREATE INDEX "withdraws_investmentId_idx" ON "withdraws"("investmentId");
CREATE INDEX "withdraws_withdrawDate_idx" ON "withdraws"("withdrawDate");
CREATE INDEX "withdraws_investmentId_withdrawDate_idx" ON "withdraws"("investmentId", "withdrawDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
