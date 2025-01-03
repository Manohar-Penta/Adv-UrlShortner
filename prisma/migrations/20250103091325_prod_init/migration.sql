/*
  Warnings:

  - You are about to drop the column `urlAlias` on the `HLclass` table. All the data in the column will be lost.
  - The `date` column on the `Request` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Url` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[os,device,shortUrl]` on the table `HLclass` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,alias]` on the table `Url` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `shortUrl` to the `HLclass` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ua` to the `Request` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "HLclass" DROP CONSTRAINT "HLclass_urlAlias_fkey";

-- DropIndex
DROP INDEX "Url_alias_key";

-- AlterTable
ALTER TABLE "HLclass" DROP COLUMN "urlAlias",
ADD COLUMN     "shortUrl" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "ua" TEXT NOT NULL,
DROP COLUMN "date",
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "location" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Url" DROP CONSTRAINT "Url_pkey",
ADD CONSTRAINT "Url_pkey" PRIMARY KEY ("shortUrl");

-- CreateIndex
CREATE UNIQUE INDEX "HLclass_os_device_shortUrl_key" ON "HLclass"("os", "device", "shortUrl");

-- CreateIndex
CREATE UNIQUE INDEX "Url_userId_alias_key" ON "Url"("userId", "alias");

-- AddForeignKey
ALTER TABLE "HLclass" ADD CONSTRAINT "HLclass_shortUrl_fkey" FOREIGN KEY ("shortUrl") REFERENCES "Url"("shortUrl") ON DELETE RESTRICT ON UPDATE CASCADE;
