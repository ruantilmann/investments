/*
  Warnings:

  - You are about to drop the column `expectedBalance` on the `investments` table. All the data in the column will be lost.

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
    "yieldAmount" REAL NOT NULL DEFAULT 0,
    "investedAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "withdrawnAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "investments_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_investments" ("createdAt", "currentAmount", "id", "initialAmount", "investedAt", "ownerName", "status", "title", "updatedAt", "walletId", "withdrawnAt", "yieldAmount") SELECT "createdAt", "currentAmount", "id", "initialAmount", "investedAt", "ownerName", "status", "title", "updatedAt", "walletId", "withdrawnAt", "yieldAmount" FROM "investments";
DROP TABLE "investments";
ALTER TABLE "new_investments" RENAME TO "investments";
CREATE INDEX "investments_walletId_idx" ON "investments"("walletId");
CREATE INDEX "investments_status_idx" ON "investments"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
