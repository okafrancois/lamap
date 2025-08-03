/*
  Warnings:

  - You are about to drop the `GameEvent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GameRoom` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RoomPlayer` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "GameEvent" DROP CONSTRAINT "GameEvent_gameId_fkey";

-- DropForeignKey
ALTER TABLE "GameEvent" DROP CONSTRAINT "GameEvent_playerId_fkey";

-- DropForeignKey
ALTER TABLE "GameEvent" DROP CONSTRAINT "GameEvent_roomId_fkey";

-- DropForeignKey
ALTER TABLE "GameRoom" DROP CONSTRAINT "GameRoom_gameId_fkey";

-- DropForeignKey
ALTER TABLE "GameRoom" DROP CONSTRAINT "GameRoom_hostId_fkey";

-- DropForeignKey
ALTER TABLE "RoomPlayer" DROP CONSTRAINT "RoomPlayer_roomId_fkey";

-- DropForeignKey
ALTER TABLE "RoomPlayer" DROP CONSTRAINT "RoomPlayer_userId_fkey";

-- DropTable
DROP TABLE "GameEvent";

-- DropTable
DROP TABLE "GameRoom";

-- DropTable
DROP TABLE "RoomPlayer";

-- DropEnum
DROP TYPE "RoomStatus";
