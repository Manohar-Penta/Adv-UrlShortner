/*
  Warnings:

  - You are about to drop the column `urlId` on the `HLclass` table. All the data in the column will be lost.
  - The primary key for the `Url` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Url` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[shortUrl]` on the table `Url` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[alias]` on the table `Url` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `urlAlias` to the `HLclass` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "HLclass" DROP CONSTRAINT "HLclass_urlId_fkey";

-- AlterTable
ALTER TABLE "HLclass" DROP COLUMN "urlId",
ADD COLUMN     "urlAlias" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Url" DROP CONSTRAINT "Url_pkey",
DROP COLUMN "id",
ALTER COLUMN "topic" DROP NOT NULL,
ADD CONSTRAINT "Url_pkey" PRIMARY KEY ("alias");

-- CreateIndex
CREATE UNIQUE INDEX "Url_shortUrl_key" ON "Url"("shortUrl");

-- CreateIndex
CREATE UNIQUE INDEX "Url_alias_key" ON "Url"("alias");

-- AddForeignKey
ALTER TABLE "HLclass" ADD CONSTRAINT "HLclass_urlAlias_fkey" FOREIGN KEY ("urlAlias") REFERENCES "Url"("alias") ON DELETE RESTRICT ON UPDATE CASCADE;
