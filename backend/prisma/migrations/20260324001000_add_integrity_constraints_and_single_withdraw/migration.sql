-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_wallets" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "balance" DECIMAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "wallets_balance_non_negative" CHECK ("balance" >= 0)
);
INSERT INTO "new_wallets" ("balance", "createdAt", "id", "updatedAt", "userId")
SELECT "balance", "createdAt", "id", "updatedAt", "userId" FROM "wallets";
DROP TABLE "wallets";
ALTER TABLE "new_wallets" RENAME TO "wallets";
CREATE UNIQUE INDEX "wallets_userId_key" ON "wallets"("userId");

CREATE TABLE "new_investments" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "walletId" INTEGER NOT NULL,
    "initialAmount" DECIMAL NOT NULL,
    "currentAmount" DECIMAL NOT NULL,
    "yieldAmount" DECIMAL NOT NULL DEFAULT 0,
    "investedAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "withdrawnAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "investments_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "investments_amounts_non_negative" CHECK ("initialAmount" >= 0 AND "currentAmount" >= 0 AND "yieldAmount" >= 0)
);
INSERT INTO "new_investments" ("createdAt", "currentAmount", "id", "initialAmount", "investedAt", "status", "updatedAt", "walletId", "withdrawnAt", "yieldAmount")
SELECT "createdAt", "currentAmount", "id", "initialAmount", "investedAt", "status", "updatedAt", "walletId", "withdrawnAt", "yieldAmount" FROM "investments";
DROP TABLE "investments";
ALTER TABLE "new_investments" RENAME TO "investments";
CREATE INDEX "investments_walletId_idx" ON "investments"("walletId");
CREATE INDEX "investments_status_idx" ON "investments"("status");
CREATE INDEX "investments_walletId_status_idx" ON "investments"("walletId", "status");

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
    CONSTRAINT "withdraws_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "investments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "withdraws_amounts_non_negative" CHECK ("grossAmount" >= 0 AND "taxAmount" >= 0 AND "netAmount" >= 0 AND "profitAmount" >= 0 AND "grossAmount" >= "taxAmount")
);
INSERT INTO "new_withdraws" ("createdAt", "grossAmount", "id", "investmentId", "netAmount", "notes", "profitAmount", "taxAmount", "withdrawDate")
SELECT "createdAt", "grossAmount", "id", "investmentId", "netAmount", "notes", "profitAmount", "taxAmount", "withdrawDate" FROM "withdraws";
DROP TABLE "withdraws";
ALTER TABLE "new_withdraws" RENAME TO "withdraws";
CREATE UNIQUE INDEX "withdraws_investmentId_key" ON "withdraws"("investmentId");
CREATE INDEX "withdraws_withdrawDate_idx" ON "withdraws"("withdrawDate");
CREATE INDEX "withdraws_investmentId_withdrawDate_idx" ON "withdraws"("investmentId", "withdrawDate");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
