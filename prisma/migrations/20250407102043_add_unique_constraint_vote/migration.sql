/*
  Warnings:

  - A unique constraint covering the columns `[songId,hostId]` on the table `Vote` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[songId,userId]` on the table `Vote` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[songId,guestId]` on the table `Vote` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Vote" ADD COLUMN     "hostId" TEXT,
ADD COLUMN     "userId" TEXT;

-- DropEnum
DROP TYPE "Provider";

-- CreateIndex
CREATE UNIQUE INDEX "Vote_songId_hostId_key" ON "Vote"("songId", "hostId");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_songId_userId_key" ON "Vote"("songId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_songId_guestId_key" ON "Vote"("songId", "guestId");

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
