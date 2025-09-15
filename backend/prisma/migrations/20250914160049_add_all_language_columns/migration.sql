/*
  Warnings:

  - You are about to drop the column `category` on the `composition` table. All the data in the column will be lost.
  - You are about to drop the column `code` on the `composition` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `composition` table. All the data in the column will be lost.
  - You are about to drop the column `percentage` on the `composition` table. All the data in the column will be lost.
  - You are about to drop the column `properties` on the `composition` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_composition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "material" TEXT,
    "spanish" TEXT,
    "french" TEXT,
    "english" TEXT,
    "portuguese" TEXT,
    "dutch" TEXT,
    "italian" TEXT,
    "greek" TEXT,
    "japanese" TEXT,
    "german" TEXT,
    "danish" TEXT,
    "slovenian" TEXT,
    "chinese" TEXT,
    "korean" TEXT,
    "indonesian" TEXT,
    "arabic" TEXT,
    "galician" TEXT,
    "catalan" TEXT,
    "basque" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_composition" ("createdAt", "id", "material", "updatedAt") SELECT "createdAt", "id", "material", "updatedAt" FROM "composition";
DROP TABLE "composition";
ALTER TABLE "new_composition" RENAME TO "composition";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
