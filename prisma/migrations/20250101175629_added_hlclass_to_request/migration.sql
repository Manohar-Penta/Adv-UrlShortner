-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "hLclassId" TEXT;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_hLclassId_fkey" FOREIGN KEY ("hLclassId") REFERENCES "HLclass"("id") ON DELETE SET NULL ON UPDATE CASCADE;
