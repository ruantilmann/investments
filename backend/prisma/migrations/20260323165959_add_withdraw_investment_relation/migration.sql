-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Withdraw" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "owner" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "date" DATETIME NOT NULL,
    "investmentId" INTEGER,
    CONSTRAINT "Withdraw_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "Investment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Withdraw" ("amount", "date", "id", "owner") SELECT "amount", "date", "id", "owner" FROM "Withdraw";
DROP TABLE "Withdraw";
ALTER TABLE "new_Withdraw" RENAME TO "Withdraw";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
