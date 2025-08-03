-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "hostId" TEXT,
ADD COLUMN     "isPrivate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "joinCode" TEXT,
ADD COLUMN     "maxPlayers" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "roomName" TEXT;
