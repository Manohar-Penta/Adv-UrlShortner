-- DropForeignKey
ALTER TABLE "Url" DROP CONSTRAINT "Url_userId_fkey";

-- AlterTable
ALTER TABLE "Url" ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Url" ADD CONSTRAINT "Url_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
