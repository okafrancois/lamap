-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('WAITING', 'PLAYING', 'ENDED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "GameMode" AS ENUM ('AI', 'ONLINE', 'LOCAL');

-- CreateEnum
CREATE TYPE "VictoryType" AS ENUM ('NORMAL', 'AUTO_SUM', 'AUTO_LOWEST', 'AUTO_SEVENS', 'SIMPLE_KORA', 'DOUBLE_KORA', 'TRIPLE_KORA');

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "mode" "GameMode" NOT NULL,
    "status" "GameStatus" NOT NULL DEFAULT 'WAITING',
    "player1Id" TEXT NOT NULL,
    "player2Id" TEXT,
    "currentBet" INTEGER NOT NULL DEFAULT 10,
    "maxRounds" INTEGER NOT NULL DEFAULT 5,
    "aiDifficulty" TEXT,
    "currentRound" INTEGER NOT NULL DEFAULT 1,
    "hasHandPlayerId" TEXT,
    "playerTurnId" TEXT,
    "winnerPlayerId" TEXT,
    "victoryType" "VictoryType",
    "endReason" TEXT,
    "seed" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "localId" TEXT,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameAction" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "round" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "localId" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "GameAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserGameStats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalGames" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "aiWins" INTEGER NOT NULL DEFAULT 0,
    "onlineWins" INTEGER NOT NULL DEFAULT 0,
    "simpleKoras" INTEGER NOT NULL DEFAULT 0,
    "doubleKoras" INTEGER NOT NULL DEFAULT 0,
    "tripleKoras" INTEGER NOT NULL DEFAULT 0,
    "autoVictories" INTEGER NOT NULL DEFAULT 0,
    "sevenVictories" INTEGER NOT NULL DEFAULT 0,
    "totalKorasWon" INTEGER NOT NULL DEFAULT 0,
    "totalKorasLost" INTEGER NOT NULL DEFAULT 0,
    "currentKoras" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserGameStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Game_gameId_key" ON "Game"("gameId");

-- CreateIndex
CREATE INDEX "Game_gameId_idx" ON "Game"("gameId");

-- CreateIndex
CREATE INDEX "Game_player1Id_idx" ON "Game"("player1Id");

-- CreateIndex
CREATE INDEX "Game_player2Id_idx" ON "Game"("player2Id");

-- CreateIndex
CREATE INDEX "Game_status_idx" ON "Game"("status");

-- CreateIndex
CREATE INDEX "GameAction_gameId_timestamp_idx" ON "GameAction"("gameId", "timestamp");

-- CreateIndex
CREATE INDEX "GameAction_playerId_idx" ON "GameAction"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "UserGameStats_userId_key" ON "UserGameStats"("userId");

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameAction" ADD CONSTRAINT "GameAction_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameAction" ADD CONSTRAINT "GameAction_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGameStats" ADD CONSTRAINT "UserGameStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
