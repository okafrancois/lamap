import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import type {
  CreateRoomInput,
  JoinRoomInput,
  PlayCardInput,
  GetRoomUpdatesInput,
} from "@/types/multiplayer";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";

// ========== SCHEMAS DE VALIDATION ==========

const createRoomSchema = z.object({
  name: z.string().min(1).max(50),
  bet: z.number().min(1).max(1000),
  maxRounds: z.number().min(1).max(10),
  isPrivate: z.boolean().optional().default(false),
  password: z.string().optional(),
});

const joinRoomSchema = z.object({
  roomId: z.string(),
  password: z.string().optional(),
});

const playCardSchema = z.object({
  gameId: z.string(),
  roomId: z.string(),
  cardId: z.string(),
});

const getRoomUpdatesSchema = z.object({
  roomId: z.string(),
  lastVersion: z.number().optional().default(0),
});

// ========== ROUTER ==========

export const multiplayerRouter = createTRPCRouter({
  // ========== MATCHMAKING ==========

  // Lister les salles publiques disponibles
  getAvailableRooms: protectedProcedure.query(async ({ ctx }) => {
    const rooms = await ctx.db.gameRoom.findMany({
      where: {
        status: "WAITING",
        isPrivate: false,
      },
      include: {
        host: {
          select: { id: true, username: true },
        },
        players: {
          include: {
            user: {
              select: { id: true, username: true },
            },
          },
        },
        _count: {
          select: { players: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20, // Limiter pour les performances
    });

    return rooms.map((room) => ({
      id: room.id,
      name: room.name,
      hostUsername: room.host.username,
      currentPlayers: room._count.players,
      maxPlayers: room.maxPlayers,
      bet: room.bet,
      maxRounds: room.maxRounds,
      createdAt: room.createdAt,
    }));
  }),

  // Créer une nouvelle salle
  createRoom: protectedProcedure
    .input(createRoomSchema)
    .mutation(async ({ ctx, input }) => {
      const { name, bet, maxRounds, isPrivate, password } = input;

      // Hasher le mot de passe si fourni
      let hashedPassword: string | undefined;
      if (password && password.length > 0) {
        hashedPassword = await bcrypt.hash(password, 10);
      }

      // Créer la salle
      const room = await ctx.db.gameRoom.create({
        data: {
          name,
          hostId: ctx.session.user.id,
          bet,
          maxRounds,
          isPrivate: isPrivate ?? false,
          password: hashedPassword,
          version: 1,
        },
        include: {
          host: {
            select: { id: true, username: true },
          },
        },
      });

      // Ajouter l'hôte comme joueur
      await ctx.db.roomPlayer.create({
        data: {
          roomId: room.id,
          userId: ctx.session.user.id,
          isHost: true,
          isReady: true, // L'hôte est automatiquement prêt
        },
      });

      return {
        roomId: room.id,
        name: room.name,
        hostUsername: room.host.username,
      };
    }),

  // Rejoindre une salle
  joinRoom: protectedProcedure
    .input(joinRoomSchema)
    .mutation(async ({ ctx, input }) => {
      const { roomId, password } = input;

      // Vérifier que la salle existe et est disponible
      const room = await ctx.db.gameRoom.findUnique({
        where: { id: roomId },
        include: {
          players: true,
          _count: { select: { players: true } },
        },
      });

      if (!room) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Salle introuvable",
        });
      }

      if (room.status !== "WAITING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cette salle n'est plus disponible",
        });
      }

      if (room._count.players >= room.maxPlayers) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cette salle est complète",
        });
      }

      // Vérifier si l'utilisateur est déjà dans la salle
      const existingPlayer = room.players.find(
        (p) => p.userId === ctx.session.user.id,
      );
      if (existingPlayer) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Vous êtes déjà dans cette salle",
        });
      }

      // Vérifier le mot de passe si nécessaire
      if (room.password && password) {
        const isValidPassword = await bcrypt.compare(password, room.password);
        if (!isValidPassword) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Mot de passe incorrect",
          });
        }
      } else if (room.password && !password) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Cette salle nécessite un mot de passe",
        });
      }

      // Ajouter le joueur
      await ctx.db.roomPlayer.create({
        data: {
          roomId: room.id,
          userId: ctx.session.user.id,
          isHost: false,
          isReady: false,
        },
      });

      // Incrémenter la version pour notifier les autres
      await ctx.db.gameRoom.update({
        where: { id: roomId },
        data: { version: { increment: 1 } },
      });

      return { success: true };
    }),

  // Quitter une salle
  leaveRoom: protectedProcedure
    .input(z.object({ roomId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { roomId } = input;

      // Supprimer le joueur de la salle
      const deletedPlayer = await ctx.db.roomPlayer.deleteMany({
        where: {
          roomId,
          userId: ctx.session.user.id,
        },
      });

      if (deletedPlayer.count === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Vous n'êtes pas dans cette salle",
        });
      }

      // Vérifier si c'était l'hôte
      const room = await ctx.db.gameRoom.findUnique({
        where: { id: roomId },
        include: { players: true },
      });

      if (!room) return { success: true };

      // Si l'hôte quitte et qu'il y a encore des joueurs, promouvoir quelqu'un d'autre
      if (room.hostId === ctx.session.user.id && room.players.length > 0) {
        const newHost = room.players[0];
        if (newHost) {
          await ctx.db.gameRoom.update({
            where: { id: roomId },
            data: { hostId: newHost.userId },
          });

          await ctx.db.roomPlayer.update({
            where: { id: newHost.id },
            data: { isHost: true },
          });
        }
      }

      // Si plus de joueurs, supprimer la salle
      if (room.players.length === 0) {
        await ctx.db.gameRoom.delete({
          where: { id: roomId },
        });
      } else {
        // Sinon incrémenter la version
        await ctx.db.gameRoom.update({
          where: { id: roomId },
          data: { version: { increment: 1 } },
        });
      }

      return { success: true };
    }),

  // Marquer comme prêt/pas prêt
  toggleReady: protectedProcedure
    .input(z.object({ roomId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { roomId } = input;

      const player = await ctx.db.roomPlayer.findFirst({
        where: {
          roomId,
          userId: ctx.session.user.id,
        },
      });

      if (!player) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Vous n'êtes pas dans cette salle",
        });
      }

      await ctx.db.roomPlayer.update({
        where: { id: player.id },
        data: { isReady: !player.isReady },
      });

      // Incrémenter la version
      await ctx.db.gameRoom.update({
        where: { id: roomId },
        data: { version: { increment: 1 } },
      });

      return { success: true };
    }),

  // ========== JEU EN TEMPS RÉEL ==========

  // Obtenir les mises à jour d'une salle (polling intelligent)
  getRoomUpdates: protectedProcedure
    .input(getRoomUpdatesSchema)
    .query(async ({ ctx, input }) => {
      const { roomId, lastVersion } = input;

      const room = await ctx.db.gameRoom.findUnique({
        where: { id: roomId },
        include: {
          host: {
            select: { id: true, username: true },
          },
          players: {
            include: {
              user: {
                select: { id: true, username: true, gameStats: true },
              },
            },
          },
          game: true, // Inclure les données de jeu si commencé
        },
      });

      if (!room) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Salle introuvable",
        });
      }

      // Vérifier si l'utilisateur est dans la salle
      const isInRoom = room.players.some(
        (p) => p.userId === ctx.session.user.id,
      );
      if (!isInRoom) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Vous n'êtes pas dans cette salle",
        });
      }

      // Si pas de changement, retourner null (optimisation)
      if (lastVersion >= room.version) {
        return null;
      }

      // Déterminer la phase actuelle
      let currentPhase:
        | "waiting"
        | "playing"
        | "my_turn"
        | "opponent_turn"
        | "ended" = "waiting";

      if (room.status === "PLAYING" && room.game) {
        currentPhase = "playing";
        // TODO: Analyser le gameState pour déterminer si c'est mon tour
        // Pour l'instant, on reste sur "playing"
      } else if (room.status === "ENDED") {
        currentPhase = "ended";
      }

      // Récupérer les événements récents (dernières 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const events = await ctx.db.gameEvent.findMany({
        where: {
          roomId,
          gameId: room.gameId ?? undefined,
          timestamp: { gte: fiveMinutesAgo },
        },
        include: {
          player: {
            select: { id: true, username: true },
          },
        },
        orderBy: { timestamp: "desc" },
        take: 20, // Limiter à 20 événements récents
      });

      return {
        room: {
          id: room.id,
          name: room.name,
          status: room.status,
          hostUsername: room.host.username,
          bet: room.bet,
          maxRounds: room.maxRounds,
          version: room.version,
        },
        players: room.players.map((p) => ({
          id: p.user.id,
          username: p.user.username,
          koras: p.user.gameStats?.currentKoras ?? 100,
          isReady: p.isReady,
          isHost: p.isHost,
          joinedAt: p.joinedAt,
        })),
        currentPhase,
        gameState: room.game
          ? {
              gameId: room.game.gameId,
              status: room.game.status,
              currentRound: room.game.currentRound,
              // TODO: Ajouter plus de détails du gameState
            }
          : null,
        events: events.map((event) => ({
          id: event.id,
          roomId: event.roomId,
          gameId: event.gameId,
          playerId: event.playerId,
          playerUsername: event.player.username,
          type: event.type,
          payload: event.payload,
          timestamp: event.timestamp,
        })),
      };
    }),

  // Démarrer la partie (hôte seulement)
  startGame: protectedProcedure
    .input(z.object({ roomId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { roomId } = input;

      const room = await ctx.db.gameRoom.findUnique({
        where: { id: roomId },
        include: { players: true },
      });

      if (!room) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Salle introuvable",
        });
      }

      if (room.hostId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Seul l'hôte peut démarrer la partie",
        });
      }

      if (room.players.length < 2) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Il faut au moins 2 joueurs pour commencer",
        });
      }

      const allReady = room.players.every((p) => p.isReady);
      if (!allReady) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tous les joueurs doivent être prêts",
        });
      }

      // Créer la partie
      const gameId = `mp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const [player1, player2] = room.players;

      const game = await ctx.db.game.create({
        data: {
          gameId,
          mode: "ONLINE",
          status: "PLAYING",
          player1Id: player1!.userId,
          player2Id: player2!.userId,
          currentBet: room.bet,
          maxRounds: room.maxRounds,
          currentRound: 1,
          seed: Date.now().toString(),
        },
      });

      // Lier la partie à la salle
      await ctx.db.gameRoom.update({
        where: { id: roomId },
        data: {
          status: "PLAYING",
          gameId: game.gameId,
          version: { increment: 1 },
        },
      });

      return {
        gameId: game.gameId,
        success: true,
      };
    }),

  // ========== ÉVÉNEMENTS DE JEU ==========

  // Envoyer un événement de jeu
  sendGameEvent: protectedProcedure
    .input(
      z.object({
        roomId: z.string(),
        gameId: z.string().optional(),
        type: z.string(),
        payload: z.any(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { roomId, gameId, type, payload } = input;

      // Vérifier que l'utilisateur est dans la salle
      const player = await ctx.db.roomPlayer.findFirst({
        where: {
          roomId,
          userId: ctx.session.user.id,
        },
      });

      if (!player) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Vous n'êtes pas dans cette salle",
        });
      }

      // Créer l'événement
      const event = await ctx.db.gameEvent.create({
        data: {
          roomId,
          gameId,
          playerId: ctx.session.user.id,
          type,
          payload,
        },
      });

      console.log(
        `📤 Événement créé: ${type} par ${ctx.session.user.username}`,
      );

      return {
        eventId: event.id,
        success: true,
      };
    }),

  // Récupérer les événements récents (utilisé par getRoomUpdates)
  getGameEvents: protectedProcedure
    .input(
      z.object({
        roomId: z.string(),
        gameId: z.string().optional(),
        since: z.date().optional(),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { roomId, gameId, since, limit } = input;

      // Vérifier que l'utilisateur est dans la salle
      const player = await ctx.db.roomPlayer.findFirst({
        where: {
          roomId,
          userId: ctx.session.user.id,
        },
      });

      if (!player) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Vous n'êtes pas dans cette salle",
        });
      }

      const events = await ctx.db.gameEvent.findMany({
        where: {
          roomId,
          gameId: gameId ?? undefined,
          timestamp: since ? { gte: since } : undefined,
        },
        include: {
          player: {
            select: { id: true, username: true },
          },
        },
        orderBy: { timestamp: "asc" },
        take: limit,
      });

      return events.map((event) => ({
        id: event.id,
        roomId: event.roomId,
        gameId: event.gameId,
        playerId: event.playerId,
        playerUsername: event.player.username,
        type: event.type,
        payload: event.payload,
        timestamp: event.timestamp,
      }));
    }),

  // TODO: Ajouter d'autres procédures si nécessaire
});
