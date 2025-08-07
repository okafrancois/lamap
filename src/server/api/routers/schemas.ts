import { z } from "zod";
import { CardSchema } from "common/deck";
import { GameStatus, VictoryType, ActionType, GameMode } from "@prisma/client";

export const PlayerTypeSchema = z.enum(["user", "ai"]);
export const AIDifficultySchema = z.enum(["easy", "medium", "hard"]);

export const PlayerEntitySchema = z.object({
  username: z.string(),
  type: PlayerTypeSchema,
  isConnected: z.boolean(),
  name: z.string().optional(),
  avatar: z.string().optional(),
  hand: z.array(CardSchema).optional(),
  koras: z.number(),
  aiDifficulty: AIDifficultySchema.optional(),
  isThinking: z.boolean().optional(),
});

export const PlayedCardSchema = z.object({
  card: CardSchema,
  playerUsername: z.string(),
  round: z.number(),
  timestamp: z.number(),
});

export const GameSchema = z.object({
  gameId: z.string(),
  status: z.nativeEnum(GameStatus),
  maxRounds: z.number(),
  currentRound: z.number(),
  hasHandUsername: z.string().nullable(),
  playerTurnUsername: z.string().nullable(),
  players: z.array(PlayerEntitySchema),
  playedCards: z.array(PlayedCardSchema),
  winnerUsername: z.string().nullable(),
  currentBet: z.number(),
  endReason: z.string().nullable(),
  gameLog: z.array(
    z.object({
      message: z.string(),
      timestamp: z.number(),
    }),
  ),
  hostUsername: z.string(),
  seed: z.string(),
  version: z.number(),
  mode: z.nativeEnum(GameMode),
  roomName: z.string().nullable().optional(),
  maxPlayers: z.number().default(2),
  isPrivate: z.boolean().default(false),
  joinCode: z.string().nullable().optional(),
  victoryType: z.nativeEnum(VictoryType).nullable().optional(),
  aiDifficulty: z.string().nullable().optional(),
  startedAt: z.date().optional(),
  endedAt: z.date().nullable().optional(),
  lastSyncedAt: z.date().optional(),
});
export const LocalGameDataSchema = z.object({
  id: z.string(),
  gameState: GameSchema,
  actions: z.array(z.any()),
  createdAt: z.number(),
  syncedAt: z.number().optional(),
  needsSync: z.boolean(),
});

export const LocalGameActionSchema = z.object({
  id: z.string(),
  gameId: z.string(),
  actionType: z.nativeEnum(ActionType),
  payload: z.any(),
  round: z.number(),
  timestamp: z.date(),
  playerId: z.string(),
  localId: z.string().optional(),
  processed: z.boolean().default(false),
});

export const CreateMultiplayerGameSchema = z.object({
  name: z.string().min(1).max(50),
  bet: z.number().min(1).max(1000),
  maxRounds: z.number().min(1).max(10),
  isPrivate: z.boolean().optional().default(false),
  joinCode: z.string().optional().nullable(),
});
