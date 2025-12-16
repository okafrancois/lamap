import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { currencyValidator } from "./validators";

function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const createFriendlyMatch = mutation({
  args: {
    hostId: v.id("users"),
    currency: currencyValidator,
  },
  handler: async (ctx, args) => {
    const host = await ctx.db.get(args.hostId);
    if (!host) {
      throw new Error("Host not found");
    }

    let joinCode = generateJoinCode();
    let existingGame = await ctx.db
      .query("games")
      .withIndex("by_join_code", (q) => q.eq("joinCode", joinCode))
      .first();

    while (existingGame) {
      joinCode = generateJoinCode();
      existingGame = await ctx.db
        .query("games")
        .withIndex("by_join_code", (q) => q.eq("joinCode", joinCode))
        .first();
    }

    const seed = crypto.randomUUID();
    const gameId = `game-${seed}`;
    const now = Date.now();

    const players: any[] = [
      {
        userId: args.hostId,
        username: host.username,
        type: "user",
        isConnected: true,
        avatar: host.avatarUrl,
        balance: 0,
      },
    ];

    const gameData = {
      gameId,
      seed,
      version: 1,
      status: "WAITING" as const,
      currentRound: 1,
      maxRounds: 5,
      hasHandPlayerId: null as any,
      currentTurnPlayerId: null as any,
      players,
      playedCards: [],
      bet: {
        amount: 0,
        currency: args.currency,
      },
      winnerId: null as any,
      endReason: null as string | null,
      history: [
        {
          action: "game_created" as const,
          timestamp: now,
          playerId: args.hostId,
          data: {
            message: `Partie amicale créée par ${host.username}`,
          },
        },
      ],
      mode: "ONLINE" as const,
      maxPlayers: 2,
      aiDifficulty: null as string | null,
      roomName: `Partie de ${host.username}`,
      isPrivate: true,
      hostId: args.hostId,
      joinCode,
      startedAt: now,
      endedAt: null as number | null,
      lastUpdatedAt: now,
      victoryType: null as string | null,
      rematchGameId: undefined,
    };

    await ctx.db.insert("games", gameData as any);

    return { gameId, joinCode };
  },
});

export const joinFriendlyMatch = mutation({
  args: {
    playerId: v.id("users"),
    joinCode: v.string(),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) {
      throw new Error("Player not found");
    }

    const game = await ctx.db
      .query("games")
      .withIndex("by_join_code", (q) => q.eq("joinCode", args.joinCode))
      .first();

    if (!game) {
      throw new Error("Code de partie invalide");
    }

    if (game.status !== "WAITING") {
      throw new Error("La partie a déjà commencé");
    }

    if (game.players.length >= game.maxPlayers) {
      throw new Error("La partie est complète");
    }

    const isAlreadyInGame = game.players.some(
      (p) => p.userId === args.playerId
    );
    if (isAlreadyInGame) {
      throw new Error("Vous êtes déjà dans cette partie");
    }

    const newPlayer = {
      userId: args.playerId,
      username: player.username,
      type: "user" as const,
      isConnected: true,
      avatar: player.avatarUrl,
      balance: 0,
    };

    await ctx.db.patch(game._id, {
      players: [...game.players, newPlayer],
      lastUpdatedAt: Date.now(),
    } as any);

    return { gameId: game.gameId, success: true };
  },
});

export const getFriendlyMatchByCode = query({
  args: {
    joinCode: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_join_code", (q) => q.eq("joinCode", args.joinCode))
      .first();

    if (!game) {
      return null;
    }

    return {
      gameId: game.gameId,
      roomName: game.roomName,
      hostId: game.hostId,
      players: game.players,
      status: game.status,
      maxPlayers: game.maxPlayers,
    };
  },
});

