/*
  Warnings:

  - You are about to drop the column `hasHandPlayerId` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `localId` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `playerTurnId` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `winnerPlayerId` on the `Game` table. All the data in the column will be lost.
  - Changed the type of `actionType` on the `GameAction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('PLAY_CARD', 'START_GAME', 'END_GAME', 'SYNC_STATE');

-- AlterTable
ALTER TABLE "Game" DROP COLUMN "hasHandPlayerId",
DROP COLUMN "localId",
DROP COLUMN "playerTurnId",
DROP COLUMN "winnerPlayerId",
ADD COLUMN     "gameLog" JSONB,
ADD COLUMN     "hasHandUsername" TEXT,
ADD COLUMN     "playerTurnUsername" TEXT,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "winnerUsername" TEXT;

-- AlterTable
ALTER TABLE "GameAction" DROP COLUMN "actionType",
ADD COLUMN     "actionType" "ActionType" NOT NULL;
