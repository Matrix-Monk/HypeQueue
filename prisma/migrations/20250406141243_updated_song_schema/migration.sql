/*
  Warnings:

  - Added the required column `extractedId` to the `Song` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Song` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Song" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "extractedId" TEXT NOT NULL,
ADD COLUMN     "thumbnail" TEXT,
ADD COLUMN     "type" TEXT NOT NULL;
