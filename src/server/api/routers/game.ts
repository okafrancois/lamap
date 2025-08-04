import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import type {
  GameState,
  PlayedCard,
  PlayerEntity,
} from "@/engine/kora-game-engine";
import { GameStatus, Prisma, type PrismaClient } from "@prisma/client";
import { CardSchema } from "common/deck";

// ========== SCHEMAS DE VALIDATION ==========

const PlayerTypeSchema = z.enum(["user", "ai"]);
const AIDifficultySchema = z.enum(["easy", "medium", "hard"]);

const PlayerEntitySchema = z.object({
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

const PlayedCardSchema = z.object({
  card: CardSchema,
  playerUsername: z.string(),
  round: z.number(),
  timestamp: z.number(),
});

const GameStateSchema = z.object({
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
});

const LocalGameDataSchema = z.object({
  id: z.string(),
  gameState: GameStateSchema,
  actions: z.array(z.any()), // Simplifié pour le moment
  createdAt: z.number(),
  syncedAt: z.number().optional(),
  needsSync: z.boolean(),
});

const LocalGameActionSchema = z.object({
  id: z.string(),
  gameId: z.string(),
  type: z.string(),
  payload: z.any(),
  timestamp: z.number(),
  playerId: z.string(),
  round: z.number(),
  synced: z.boolean(),
});

// ========== ROUTER ==========

export const gameRouter = createTRPCRouter({
  // Créer une partie multijoueur
  createMultiplayerGame: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(50),
        bet: z.number().min(1).max(1000),
        maxRounds: z.number().min(1).max(10),
        isPrivate: z.boolean().optional().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const gameId = `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Créer le joueur créateur
      const creatorPlayer = {
        username: ctx.session.user.username,
        type: "user",
        isConnected: true,
        name: ctx.session.user.name ?? ctx.session.user.username,
        koras: 100,
      };

      const game = await ctx.db.game.create({
        data: {
          gameId,
          mode: "ONLINE",
          status: "WAITING",
          currentBet: input.bet,
          maxRounds: input.maxRounds,
          roomName: input.name,
          isPrivate: input.isPrivate,
          hostUsername: ctx.session.user.username,
          seed: Math.random().toString(36),
          players: [creatorPlayer], // Commencer avec le créateur
        },
      });

      return {
        gameId: game.gameId,
        name: game.roomName,
      };
    }),

  // Lister les parties disponibles
  getAvailableGames: protectedProcedure.query(async ({ ctx }) => {
    const games = await ctx.db.game.findMany({
      where: {
        mode: "ONLINE",
        status: "WAITING",
        isPrivate: false,
      },
      orderBy: { startedAt: "desc" },
      take: 20,
    });

    return games.map((game) => {
      const players = game.players
        ? (JSON.parse(game.players as string) as PlayerEntity[])
        : [];
      const hostPlayer = players.find(
        (p: PlayerEntity) =>
          p.type === "user" && p.username === game.hostUsername,
      );

      return {
        gameId: game.gameId,
        name: game.roomName ?? `Partie de ${hostPlayer?.username ?? "Inconnu"}`,
        hostUsername: hostPlayer?.username ?? "Inconnu",
        currentPlayers: players.length,
        maxPlayers: game.maxPlayers,
        bet: game.currentBet,
        maxRounds: game.maxRounds,
        createdAt: game.startedAt,
      };
    });
  }),

  // Rejoindre une partie
  joinGame: protectedProcedure
    .input(z.object({ gameId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const game = await ctx.db.game.findUnique({
        where: { gameId: input.gameId },
      });

      if (!game) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Partie introuvable",
        });
      }

      const players = game.players as unknown as PlayerEntity[];

      if (players.length >= 2) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Partie déjà pleine",
        });
      }

      // Vérifier si l'utilisateur est déjà dans la partie
      const isAlreadyInGame = players.some(
        (p) => p.username === ctx.session.user.username,
      );
      if (isAlreadyInGame) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Vous êtes déjà dans cette partie",
        });
      }

      // Ajouter le nouveau joueur
      const newPlayer = {
        username: ctx.session.user.username,
        type: "user",
        isConnected: true,
        name: ctx.session.user.name ?? ctx.session.user.username,
        koras: 100,
      };

      const updatedPlayers = [...players, newPlayer];

      await ctx.db.game.update({
        where: { gameId: input.gameId },
        data: {
          players: updatedPlayers as unknown as Prisma.InputJsonValue,
          status: updatedPlayers.length === 2 ? "PLAYING" : "WAITING",
        },
      });

      return { success: true };
    }),
  // Sauvegarder une partie
  saveGame: protectedProcedure
    .input(LocalGameDataSchema)
    .mutation(async ({ ctx, input }) => {
      const { gameState } = input;

      // Vérifier que l'utilisateur est bien dans cette partie
      const isPlayerInGame = gameState.players.some(
        (p) => p.username === ctx.session.user.username,
      );

      if (!isPlayerInGame) {
        throw new Error("Utilisateur non autorisé pour cette partie");
      }

      // Déterminer le mode de jeu
      const gameMode = gameState.players.some((p) => p.type === "ai")
        ? "AI"
        : "ONLINE";

      // Préparer les données des joueurs avec leurs mains
      const playersData = gameState.players.map((player) => ({
        username: player.username,
        type: player.type,
        isConnected: player.isConnected,
        name: player.name,
        avatar: player.avatar,
        hand: player.hand ?? [],
        koras: player.koras,
        aiDifficulty: player.aiDifficulty,
        isThinking: player.isThinking,
      }));

      // Upsert la partie en base
      const game = await ctx.db.game.upsert({
        where: { gameId: gameState.gameId },
        update: {
          status: gameState.status,
          currentRound: gameState.currentRound,
          hasHandPlayerId: gameState.hasHandUsername,
          playerTurnId: gameState.playerTurnUsername,
          winnerPlayerId: gameState.winnerUsername,
          endReason: gameState.endReason,
          endedAt: gameState.status === GameStatus.ENDED ? new Date() : null,
          lastSyncedAt: new Date(),
          // Sauvegarder les données complètes des joueurs
          players: playersData,
          playedCards: gameState.playedCards,
        },
        create: {
          gameId: gameState.gameId,
          mode: gameMode,
          status: gameState.status,
          currentBet: gameState.currentBet,
          maxRounds: gameState.maxRounds,
          aiDifficulty:
            gameState.players.find((p) => p.type === "ai")?.aiDifficulty ??
            null,
          currentRound: gameState.currentRound,
          hasHandPlayerId: gameState.hasHandUsername,
          playerTurnId: gameState.playerTurnUsername,
          winnerPlayerId: gameState.winnerUsername,
          endReason: gameState.endReason,
          seed: gameState.seed,
          endedAt: gameState.status === GameStatus.ENDED ? new Date() : null,
          localId: input.id,
          hostUsername: gameState.hostUsername,
          players: playersData,
          playedCards: gameState.playedCards,
        },
      });

      // Mettre à jour les stats si la partie est terminée
      if (gameState.status === GameStatus.ENDED && gameState.winnerUsername) {
        await updateUserStats(
          ctx.db,
          ctx.session.user.id,
          gameState,
          gameMode === "AI",
        );
      }

      return {
        success: true,
        gameId: game.gameId,
        synced: true,
      };
    }),

  // Sauvegarder une action
  saveAction: protectedProcedure
    .input(LocalGameActionSchema)
    .mutation(async ({ ctx, input }) => {
      // Vérifier que la partie existe et que l'utilisateur y participe
      const game = await ctx.db.game.findUnique({
        where: { gameId: input.gameId },
      });

      if (!game) {
        throw new Error("Partie non trouvée");
      }

      const formattedGame = {
        ...game,
        players: game.players as unknown as PlayerEntity[],
        playedCards: game.playedCards as unknown as PlayedCard[],
      };

      // Vérifier les permissions
      const isAuthorized = formattedGame.players.some(
        (p) => p.username === ctx.session.user.username,
      );

      if (!isAuthorized) {
        throw new Error("Non autorisé pour cette partie");
      }

      // Trouver l'utilisateur dans la base pour avoir son ID
      const user = await ctx.db.user.findUnique({
        where: { username: ctx.session.user.username },
      });

      if (!user) {
        throw new Error("Utilisateur non trouvé");
      }

      // Vérifier si l'action existe déjà (éviter les doublons)
      const existingAction = await ctx.db.gameAction.findFirst({
        where: {
          gameId: game.gameId,
          localId: input.id,
        },
      });

      if (existingAction) {
        return {
          success: true,
          actionId: existingAction.id,
          duplicate: true,
        };
      }

      // Créer l'action en base
      const dbAction = await ctx.db.gameAction.create({
        data: {
          gameId: game.gameId,
          playerId: user.id,
          actionType: input.type,
          payload: input.payload,
          round: input.round,
          timestamp: new Date(input.timestamp),
          localId: input.id,
          processed: true,
        },
      });

      return {
        success: true,
        actionId: dbAction.id,
        synced: true,
      };
    }),

  // Récupérer une partie
  getGame: protectedProcedure
    .input(z.object({ gameId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Récupérer la partie avec ses actions
      const game = await ctx.db.game.findUnique({
        where: { gameId: input.gameId },
        include: {
          actions: {
            orderBy: { timestamp: "asc" },
            include: {
              player: {
                select: { username: true },
              },
            },
          },
        },
      });

      if (!game) {
        throw new Error("Partie non trouvée");
      }

      const players = game.players as unknown as PlayerEntity[];

      const playedCards = game.playedCards as unknown as PlayedCard[];

      // Vérifier les permissions
      const isPlayerInGame = players.some(
        (p) => p.username === ctx.session.user.username,
      );

      const canJoinGame =
        game.status === "WAITING" &&
        players.length < 2 &&
        game.mode === "ONLINE";

      if (!isPlayerInGame && !canJoinGame) {
        throw new Error("Non autorisé pour cette partie");
      }

      // Convertir au format attendu par le client
      return {
        ...game,
        players,
        playedCards,
      };
    }),

  // Récupérer les stats de l'utilisateur
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const stats = await ctx.db.userGameStats.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!stats) {
      // Créer des stats par défaut si elles n'existent pas
      const newStats = await ctx.db.userGameStats.create({
        data: {
          userId: ctx.session.user.id,
          currentKoras: 100, // Koras de départ
        },
      });
      return newStats;
    }

    return stats;
  }),

  // Mettre à jour les stats
  updateStats: protectedProcedure
    .input(z.record(z.any()))
    .mutation(async ({ ctx, input }) => {
      const updatedStats = await ctx.db.userGameStats.upsert({
        where: { userId: ctx.session.user.id },
        update: input,
        create: {
          userId: ctx.session.user.id,
          currentKoras: 100,
          ...input,
        },
      });

      return {
        success: true,
        stats: updatedStats,
      };
    }),

  // Récupérer l'historique des parties
  getHistory: protectedProcedure.query(async ({ ctx }) => {
    // TODO: adapter pour utiliser players JSON
    return [];
  }),

  // Récupérer les parties en cours
  getOngoingGames: protectedProcedure.query(async ({ ctx }) => {
    const games = await ctx.db.game.findMany({
      where: {
        playedBy: {
          some: {
            id: ctx.session.user.id,
          },
        },
        status: "PLAYING",
      },
      orderBy: {
        startedAt: "desc",
      },
    });

    const formattedGames = games.map((game) => ({
      ...game,
      players: game.players as unknown as PlayerEntity[],
      playedCards: game.playedCards as unknown as PlayedCard[],
    }));

    return formattedGames;
  }),
});

// ========== HELPER FUNCTIONS ==========

async function updateUserStats(
  db: PrismaClient,
  userId: string,
  gameState: GameState,
  isAiGame: boolean,
) {
  try {
    const userPlayer = gameState.players.find((p) => p.type === "user");
    const isWinner = gameState.winnerUsername === userPlayer?.username;
    const korasChange = isWinner ? gameState.currentBet : -gameState.currentBet;

    await db.userGameStats.upsert({
      where: { userId },
      update: {
        totalGames: { increment: 1 },
        wins: isWinner ? { increment: 1 } : undefined,
        losses: !isWinner ? { increment: 1 } : undefined,
        aiWins: isWinner && isAiGame ? { increment: 1 } : undefined,
        onlineWins: isWinner && !isAiGame ? { increment: 1 } : undefined,
        totalKorasWon: isWinner
          ? { increment: gameState.currentBet }
          : undefined,
        totalKorasLost: !isWinner
          ? { increment: gameState.currentBet }
          : undefined,
        currentKoras: { increment: korasChange },
      },
      create: {
        userId,
        totalGames: 1,
        wins: isWinner ? 1 : 0,
        losses: isWinner ? 0 : 1,
        aiWins: isWinner && isAiGame ? 1 : 0,
        onlineWins: isWinner && !isAiGame ? 1 : 0,
        totalKorasWon: isWinner ? gameState.currentBet : 0,
        totalKorasLost: isWinner ? 0 : gameState.currentBet,
        currentKoras: 100 + korasChange,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour des stats:", error);
  }
}
