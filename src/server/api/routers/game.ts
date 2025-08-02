import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import type { GameState } from "@/engine/kora-game-engine";

// ========== SCHEMAS DE VALIDATION ==========

const GameStatusSchema = z.enum(["waiting", "playing", "ended"]);
const PlayerTypeSchema = z.enum(["user", "ai"]);
const AIDifficultySchema = z.enum(["easy", "medium", "hard"]);

const PlayerEntitySchema = z.object({
  username: z.string(),
  type: PlayerTypeSchema,
  isConnected: z.boolean(),
  name: z.string().optional(),
  avatar: z.string().optional(),
  hand: z.array(z.any()).optional(), // Simplifié pour le moment
  koras: z.number(),
  aiDifficulty: AIDifficultySchema.optional(),
  isThinking: z.boolean().optional(),
});

const PlayedCardSchema = z.object({
  card: z.any(), // Simplifié pour le moment
  playerUsername: z.string(),
  round: z.number(),
  timestamp: z.number(),
});

const GameStateSchema = z.object({
  gameId: z.string(),
  status: GameStatusSchema,
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

      // Trouver player2Id (pour mode AI, c'est null)
      const player1 = gameState.players.find((p) => p.type === "user");
      const player2 = gameState.players.find(
        (p) => p.type === "user" && p.username !== player1?.username,
      );

      let player2Id = null;
      if (player2 && gameMode === "ONLINE") {
        const player2User = await ctx.db.user.findUnique({
          where: { username: player2.username },
        });
        player2Id = player2User?.id ?? null;
      }

      // Convertir le status
      const statusMapping = {
        waiting: "WAITING",
        playing: "PLAYING",
        ended: "ENDED",
      } as const;

      // Upsert la partie en base
      const game = await ctx.db.game.upsert({
        where: { gameId: gameState.gameId },
        update: {
          status: statusMapping[gameState.status] || "PLAYING",
          currentRound: gameState.currentRound,
          hasHandPlayerId: gameState.hasHandUsername,
          playerTurnId: gameState.playerTurnUsername,
          winnerPlayerId: gameState.winnerUsername,
          endReason: gameState.endReason,
          endedAt: gameState.status === "ended" ? new Date() : null,
          lastSyncedAt: new Date(),
        },
        create: {
          gameId: gameState.gameId,
          mode: gameMode,
          status: statusMapping[gameState.status] || "PLAYING",
          player1Id: ctx.session.user.id,
          player2Id,
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
          endedAt: gameState.status === "ended" ? new Date() : null,
          localId: input.id,
        },
      });

      // Mettre à jour les stats si la partie est terminée
      if (gameState.status === "ended" && gameState.winnerUsername) {
        await updateUserStats(
          ctx.db,
          ctx.session.user.id,
          gameState as GameState,
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
        include: {
          player1: true,
          player2: true,
        },
      });

      if (!game) {
        throw new Error("Partie non trouvée");
      }

      // Vérifier les permissions
      const isAuthorized =
        game.player1.username === ctx.session.user.username ||
        game.player2?.username === ctx.session.user.username;

      if (!isAuthorized) {
        throw new Error("Non autorisé pour cette partie");
      }

      // Trouver l'ID du joueur
      let playerId = game.player1Id;
      if (game.player2 && input.playerId === game.player2.username) {
        playerId = game.player2Id!;
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
          playerId,
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
          player1: {
            select: { id: true, username: true, name: true },
          },
          player2: {
            select: { id: true, username: true, name: true },
          },
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

      // Vérifier les permissions
      const isAuthorized =
        game.player1.username === ctx.session.user.username ||
        game.player2?.username === ctx.session.user.username;

      if (!isAuthorized) {
        throw new Error("Non autorisé pour cette partie");
      }

      // Convertir au format attendu par le client
      return {
        gameId: game.gameId,
        mode: game.mode.toLowerCase(),
        status: game.status.toLowerCase(),
        startedAt: game.startedAt.toISOString(),
        endedAt: game.endedAt?.toISOString(),

        // Configuration
        currentBet: game.currentBet,
        maxRounds: game.maxRounds,
        aiDifficulty: game.aiDifficulty,

        // État actuel
        currentRound: game.currentRound,
        hasHandPlayerId: game.hasHandPlayerId,
        playerTurnId: game.playerTurnId,
        winnerPlayerId: game.winnerPlayerId,
        endReason: game.endReason,
        seed: game.seed,

        // Joueurs
        players: [
          {
            id: game.player1.id,
            username: game.player1.username,
            name: game.player1.name,
            type: "user",
          },
          game.player2
            ? {
                id: game.player2.id,
                username: game.player2.username,
                name: game.player2.name,
                type: "user",
              }
            : {
                id: "ai",
                username: "ai-opponent",
                name: "IA",
                type: "ai",
                aiDifficulty: game.aiDifficulty,
              },
        ],

        // Actions
        actions: game.actions.map((action) => ({
          id: action.id,
          gameId: action.gameId,
          actionType: action.actionType,
          payload: action.payload,
          round: action.round,
          timestamp: action.timestamp.toISOString(),
          playerId: action.playerId,
          playerUsername: action.player.username,
          localId: action.localId,
        })),

        // Métadonnées de sync
        lastSyncedAt: game.lastSyncedAt.toISOString(),
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
    const games = await ctx.db.game.findMany({
      where: {
        OR: [
          { player1Id: ctx.session.user.id },
          { player2Id: ctx.session.user.id },
        ],
        status: "ENDED", // Seulement les parties terminées
      },
      include: {
        player1: {
          select: { username: true, name: true },
        },
        player2: {
          select: { username: true, name: true },
        },
      },
      orderBy: {
        endedAt: "desc",
      },
      take: 20, // Les 20 dernières parties
    });

    return games;
  }),

  // Debug : récupérer toutes les parties (y compris en cours)
  getAllGames: protectedProcedure.query(async ({ ctx }) => {
    const games = await ctx.db.game.findMany({
      where: {
        OR: [
          { player1Id: ctx.session.user.id },
          { player2Id: ctx.session.user.id },
        ],
      },
      include: {
        player1: {
          select: { username: true, name: true },
        },
        player2: {
          select: { username: true, name: true },
        },
      },
      orderBy: {
        startedAt: "desc",
      },
      take: 10,
    });

    return games.map((game) => ({
      gameId: game.gameId,
      mode: game.mode,
      status: game.status,
      startedAt: game.startedAt,
      endedAt: game.endedAt,
      currentBet: game.currentBet,
      winnerPlayerId: game.winnerPlayerId,
      victoryType: game.victoryType,
      endReason: game.endReason,
      currentRound: game.currentRound,
      opponent:
        game.mode === "AI"
          ? { username: "ai-opponent", name: "IA" }
          : game.player1Id === ctx.session.user.id
            ? game.player2
            : game.player1,
    }));
  }),

  // Debug : forcer la fin d'une partie
  forceEndGame: protectedProcedure
    .input(z.object({ gameId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const game = await ctx.db.game.findUnique({
        where: { gameId: input.gameId },
        include: { player1: true, player2: true },
      });

      if (!game) {
        throw new Error("Partie non trouvée");
      }

      // Vérifier les permissions
      const isAuthorized =
        game.player1Id === ctx.session.user.id ||
        game.player2?.id === ctx.session.user.id;

      if (!isAuthorized) {
        throw new Error("Non autorisé");
      }

      // Forcer la fin de la partie
      const updatedGame = await ctx.db.game.update({
        where: { gameId: input.gameId },
        data: {
          status: "ENDED",
          endedAt: new Date(),
          winnerPlayerId: game.player1Id, // Arbitraire pour debug
          endReason: "debug_force_end",
        },
      });

      // Mettre à jour les stats
      await updateUserStats(
        ctx.db,
        game.player1Id,
        {
          status: "ended",
          winnerUsername: game.player1.username,
          currentBet: game.currentBet,
          players: [
            { type: "user", username: game.player1.username },
            game.player2
              ? { type: "user", username: game.player2.username }
              : { type: "ai", username: "ai-opponent" },
          ],
        } as any,
        game.mode === "AI",
      );

      return { success: true, game: updatedGame };
    }),

  // Récupérer les parties en cours
  getOngoingGames: protectedProcedure.query(async ({ ctx }) => {
    const games = await ctx.db.game.findMany({
      where: {
        OR: [
          { player1Id: ctx.session.user.id },
          { player2Id: ctx.session.user.id },
        ],
        status: "PLAYING",
      },
      include: {
        player1: {
          select: { username: true, name: true },
        },
        player2: {
          select: { username: true, name: true },
        },
      },
      orderBy: {
        startedAt: "desc",
      },
    });

    return games.map((game) => ({
      gameId: game.gameId,
      mode: game.mode,
      status: game.status,
      startedAt: game.startedAt,
      currentBet: game.currentBet,
      currentRound: game.currentRound,
      maxRounds: game.maxRounds,
      hasHandPlayerId: game.hasHandPlayerId,
      playerTurnId: game.playerTurnId,
      aiDifficulty: game.aiDifficulty,
      opponent:
        game.mode === "AI"
          ? { username: "ai-opponent", name: "IA" }
          : game.player1Id === ctx.session.user.id
            ? game.player2
            : game.player1,
    }));
  }),
});

// ========== HELPER FUNCTIONS ==========

async function updateUserStats(
  db: any,
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
