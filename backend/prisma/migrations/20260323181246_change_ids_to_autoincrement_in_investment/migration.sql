/*
  Warnings:

  - The primary key for the `investments` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `investments` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - The primary key for the `withdraws` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `withdraws` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `investmentId` on the `withdraws` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_investments" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "walletId" INTEGER NOT NULL,
    "ownerName" TEXT,
    "title" TEXT,
    "initialAmount" REAL NOT NULL,
    "currentAmount" REAL NOT NULL,
    "expectedBalance" REAL NOT NULL,
    "yieldAmount" REAL NOT NULL DEFAULT 0,
    "investedAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "withdrawnAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "investments_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_investments" ("createdAt", "currentAmount", "expectedBalance", "id", "initialAmount", "investedAt", "ownerName", "status", "title", "updatedAt", "walletId", "withdrawnAt", "yieldAmount") SELECT "createdAt", "currentAmount", "expectedBalance", "id", "initialAmount", "investedAt", "ownerName", "status", "title", "updatedAt", "walletId", "withdrawnAt", "yieldAmount" FROM "investments";
DROP TABLE "investments";
ALTER TABLE "new_investments" RENAME TO "investments";
CREATE INDEX "investments_walletId_idx" ON "investments"("walletId");
CREATE INDEX "investments_status_idx" ON "investments"("status");
CREATE TABLE "new_withdraws" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "investmentId" INTEGER NOT NULL,
    "grossAmount" REAL NOT NULL,
    "taxAmount" REAL NOT NULL DEFAULT 0,
    "netAmount" REAL NOT NULL,
    "profitAmount" REAL NOT NULL DEFAULT 0,
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
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
