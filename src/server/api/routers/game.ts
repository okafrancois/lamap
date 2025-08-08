import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import type { Game, PlayedCard, PlayerEntity } from "@/engine/kora-game-engine";
import { GameStatus, type Prisma, type PrismaClient } from "@prisma/client";
import {
  LocalGameActionSchema,
  CreateMultiplayerGameSchema,
  type GameSchemaType,
} from "./schemas";

// ========== ROUTER ==========

export const gameRouter = createTRPCRouter({
  // Créer une partie multijoueur
  createMultiplayerGame: protectedProcedure
    .input(CreateMultiplayerGameSchema)
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
          ...(input.isPrivate &&
            input.joinCode && {
              isPrivate: true,
              joinCode: input.joinCode,
            }),
          playedBy: {
            connect: {
              id: ctx.session.user.id,
            },
          },
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
        koras: ctx.session.user.koras,
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
    .input(z.any())
    .mutation(async ({ ctx, input }) => {
      const gameData = input as GameSchemaType;
      // Vérifier que l'utilisateur est bien dans cette partie
      const isPlayerInGame = gameData.players.some(
        (p) => p.username === ctx.session.user.username,
      );

      if (!isPlayerInGame) {
        throw new Error("Utilisateur non autorisé pour cette partie");
      }

      // Extraire les actions pour les gérer séparément
      const { actions, ...gameDataWithoutActions } = gameData;

      // Upsert la partie en base
      const game = await ctx.db.game.upsert({
        where: { gameId: input.gameId },
        update: {
          ...gameDataWithoutActions,
          endedAt: gameData.status === GameStatus.ENDED ? new Date() : null,
          lastSyncedAt: new Date(),
          players: gameData.players,
          playedCards: input.playedCards as unknown as Prisma.InputJsonValue,
        },
        create: {
          gameId: input.gameId,
          mode: input.mode,
          status: input.status,
          currentBet: input.currentBet,
          maxRounds: input.maxRounds,
          ...(input.mode === "AI" && {
            aiDifficulty:
              input.players.find((p) => p.type === "ai")?.aiDifficulty ?? null,
          }),
          ...(input.mode === "ONLINE" && {
            isPrivate: input.isPrivate,
            joinCode: input.joinCode,
          }),
          currentRound: input.currentRound,
          hasHandUsername: input.hasHandUsername,
          playerTurnUsername: input.playerTurnUsername,
          winnerUsername: input.winnerUsername,
          endReason: input.endReason,
          seed: input.seed,
          endedAt: input.status === GameStatus.ENDED ? new Date() : null,
          hostUsername: input.hostUsername,
          players: input.players,
          playedCards: input.playedCards,
        },
      });

      // Persister les actions
      await ctx.db.gameAction.createMany({
        data: actions.map((action) => ({
          gameId: input.gameId,
          playerId: action.playerId,
          actionType: action.actionType,
          payload: action.payload ?? {},
          round: action.round,
          timestamp: action.timestamp,
          localId: action.localId,
          processed: action.processed,
        })),
        skipDuplicates: true,
      });

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
          actionType: input.actionType,
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

      const gameData: Game = {
        ...game,
        players,
        playedCards,
        gameLog: game.gameLog as unknown as Array<{
          message: string;
          timestamp: number;
        }>,
        actions: game.actions.map((action) => ({
          type: action.actionType as
            | "PLAY_CARD"
            | "START_GAME"
            | "END_GAME"
            | "SYNC_STATE",
          payload: action.payload,
          timestamp: action.timestamp.getTime(),
          playerUsername: action.player.username,
          actionId: action.id,
        })),
      };

      return gameData;
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
  gameState: Game,
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
