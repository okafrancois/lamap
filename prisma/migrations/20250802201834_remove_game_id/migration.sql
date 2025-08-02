/*
  Warnings:

  - The primary key for the `Game` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Game` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "GameAction" DROP CONSTRAINT "GameAction_gameId_fkey";

-- AlterTable
ALTER TABLE "Game" DROP CONSTRAINT "Game_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "Game_pkey" PRIMARY KEY ("gameId");

-- AddForeignKey
ALTER TABLE "GameAction" ADD CONSTRAINT "GameAction_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("gameId") ON DELETE CASCADE ON UPDATE CASCADE;
