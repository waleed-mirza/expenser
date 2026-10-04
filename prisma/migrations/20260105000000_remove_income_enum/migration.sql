-- The app is expense-only; drop the unused 'income' enum value.
-- Postgres cannot drop enum values, so the types are recreated.
-- This fails (and rolls back) if any row still uses 'income'.

-- CategoryType
ALTER TABLE "Category" ALTER COLUMN "type" DROP DEFAULT;
ALTER TYPE "CategoryType" RENAME TO "CategoryType_old";
CREATE TYPE "CategoryType" AS ENUM ('expense');
ALTER TABLE "Category" ALTER COLUMN "type" TYPE "CategoryType" USING ("type"::text::"CategoryType");
ALTER TABLE "Category" ALTER COLUMN "type" SET DEFAULT 'expense';
DROP TYPE "CategoryType_old";

-- TransactionType
ALTER TABLE "Transaction" ALTER COLUMN "type" DROP DEFAULT;
ALTER TYPE "TransactionType" RENAME TO "TransactionType_old";
CREATE TYPE "TransactionType" AS ENUM ('expense');
ALTER TABLE "Transaction" ALTER COLUMN "type" TYPE "TransactionType" USING ("type"::text::"TransactionType");
ALTER TABLE "Transaction" ALTER COLUMN "type" SET DEFAULT 'expense';
DROP TYPE "TransactionType_old";
