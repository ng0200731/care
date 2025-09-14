-- CreateTable
CREATE TABLE "shortform" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symbol" TEXT,
    "code" TEXT,
    "name" TEXT,
    "category" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "composition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "material" TEXT,
    "percentage" TEXT,
    "code" TEXT,
    "category" TEXT,
    "properties" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
