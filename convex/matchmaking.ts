import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { INITIAL_PR } from "./ranking";
import { aiDifficultyValidator, currencyValidator, Player } from "./validators";

function getPRRange(waitTimeMs: number): number {
  if (waitTimeMs < 30000) return 100;
  if (waitTimeMs < 60000) return 200;
  return 300;
}

export const joinQueue = mutation({
  args: {
    userId: v.id("users"),
    betAmount: v.number(),
    currency: currencyValidator,
    mode: v.optional(v.union(v.literal("RANKED"), v.literal("CASH"))),
    competitive: v.optional(v.boolean()),
    timerEnabled: v.optional(v.boolean()),
    timerDuration: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const gameMode = args.mode || (args.betAmount === 0 ? "RANKED" : "CASH");
    const isCompetitive =
      args.competitive !== undefined ? args.competitive : true;

    const existing = await ctx.db
      .query("matchmakingQueue")
      .withIndex("by_status_bet_currency", (q) =>
        q
          .eq("status", "searching")
          .eq("betAmount", args.betAmount)
          .eq("currency", args.currency)
      )
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (existing) {
      return existing._id;
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    if ((user.balance || 0) < args.betAmount) {
      throw new Error("Insufficient balance");
    }

    const queueEntry = await ctx.db.insert("matchmakingQueue", {
      userId: args.userId,
      betAmount: args.betAmount,
      currency: args.currency,
      status: "searching",
      joinedAt: Date.now(),
    });

    const currentPlayerPR = user.pr || INITIAL_PR;
    const now = Date.now();

    const waitingPlayers = await ctx.db
      .query("matchmakingQueue")
      .withIndex("by_status_bet_currency", (q) =>
        q
          .eq("status", "searching")
          .eq("betAmount", args.betAmount)
          .eq("currency", args.currency)
      )
      .filter((q) => q.neq(q.field("userId"), args.userId))
      .collect();

    let potentialMatch = null;
    let bestPRDifference = Infinity;

    for (const candidate of waitingPlayers) {
      const candidateUser = await ctx.db.get(candidate.userId);
      if (!candidateUser) continue;

      const candidatePR = candidateUser.pr || INITIAL_PR;
      const candidateWaitTime = now - candidate.joinedAt;
      const candidatePRRange = getPRRange(candidateWaitTime);

      const prDifference = Math.abs(currentPlayerPR - candidatePR);

      if (prDifference <= candidatePRRange && prDifference < bestPRDifference) {
        potentialMatch = candidate;
        bestPRDifference = prDifference;
      }
    }

    if (potentialMatch) {
      const player1 = await ctx.db.get(args.userId);
      const player2 = await ctx.db.get(potentialMatch.userId);

      if (!player1 || !player2) {
        throw new Error("Players not found");
      }

      if (
        (player1.balance || 0) < args.betAmount ||
        (player2.balance || 0) < args.betAmount
      ) {
        throw new Error("Insufficient balance");
      }

      const seed = crypto.randomUUID();
      const gameId = `game-${seed}`;

      await ctx.db.patch(args.userId, {
        balance: (player1.balance || 0) - args.betAmount,
      });

      await ctx.db.patch(potentialMatch.userId, {
        balance: (player2.balance || 0) - args.betAmount,
      });

      await ctx.db.insert("transactions", {
        userId: args.userId,
        type: "bet",
        amount: -args.betAmount,
        currency: args.currency,
        gameId,
        description: `Mise de ${args.betAmount} ${args.currency} pour la partie`,
        createdAt: Date.now(),
      });

      await ctx.db.insert("transactions", {
        userId: potentialMatch.userId,
        type: "bet",
        amount: -args.betAmount,
        currency: args.currency,
        gameId,
        description: `Mise de ${args.betAmount} ${args.currency} pour la partie`,
        createdAt: Date.now(),
      });

      await ctx.db.patch(queueEntry, {
        status: "matched",
        matchedWith: potentialMatch.userId,
        gameId,
      });

      await ctx.db.patch(potentialMatch._id, {
        status: "matched",
        matchedWith: args.userId,
        gameId,
      });

      const now = Date.now();
      const players: Player[] = [
        {
          userId: args.userId,
          username: player1.username,
          type: "user",
          isConnected: true,
          avatar: player1.avatarUrl,
          balance: 0,
        },
        {
          userId: potentialMatch.userId,
          username: player2.username,
          type: "user",
          isConnected: true,
          avatar: player2.avatarUrl,
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
        hasHandPlayerId: null,
        currentTurnPlayerId: null,
        players,
        playedCards: [],
        bet: {
          amount: args.betAmount,
          currency: args.currency,
        },
        winnerId: null,
        endReason: null as string | null,
        history: [
          {
            action: "game_created" as const,
            timestamp: now,
            playerId: args.userId,
            data: {
              message: `Partie créée entre ${player1.username} et ${player2.username}`,
            },
          },
        ],
        mode: gameMode === "RANKED" ? ("RANKED" as const) : ("CASH" as const),
        competitive: isCompetitive,
        maxPlayers: 2,
        aiDifficulty: null,
        roomName: undefined,
        isPrivate: false,
        hostId: args.userId,
        joinCode: undefined,
        startedAt: now,
        endedAt: null,
        lastUpdatedAt: now,
        victoryType: null,
        rematchGameId: undefined,
        timerEnabled: args.timerEnabled || false,
        timerDuration: args.timerDuration,
        playerTimers:
          args.timerEnabled ?
            [
              {
                playerId: args.userId,
                timeRemaining: args.timerDuration || 300,
                lastUpdated: now,
              },
              {
                playerId: potentialMatch.userId,
                timeRemaining: args.timerDuration || 300,
                lastUpdated: now,
              },
            ]
          : undefined,
      };

      await ctx.db.insert("games", gameData);

      return { matched: true, gameId, queueId: queueEntry };
    }

    return { matched: false, queueId: queueEntry };
  },
});

export const leaveQueue = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const queueEntry = await ctx.db
      .query("matchmakingQueue")
      .withIndex("by_status_bet", (q) => q.eq("status", "searching"))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (queueEntry) {
      await ctx.db.patch(queueEntry._id, {
        status: "cancelled",
      });

      await ctx.db.delete(queueEntry._id);
    }

    return { success: true };
  },
});

export const cleanupQueueForGame = internalMutation({
  args: {
    gameId: v.string(),
  },
  handler: async (ctx, args) => {
    const matchedEntries = await ctx.db
      .query("matchmakingQueue")
      .filter((q) => q.eq(q.field("status"), "matched"))
      .filter((q) => q.eq(q.field("gameId"), args.gameId))
      .collect();

    for (const entry of matchedEntries) {
      await ctx.db.delete(entry._id);
    }

    return { cleaned: matchedEntries.length };
  },
});

export const getMyStatus = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const queueEntry = await ctx.db
      .query("matchmakingQueue")
      .withIndex("by_status_bet", (q) => q.eq("status", "searching"))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (!queueEntry) {
      const matched = await ctx.db
        .query("matchmakingQueue")
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .filter((q) => q.eq(q.field("status"), "matched"))
        .first();

      if (matched && matched.gameId) {
        const game = await ctx.db
          .query("games")
          .withIndex("by_game_id", (q) => q.eq("gameId", matched.gameId!))
          .first();
        const opponent =
          matched.matchedWith ? await ctx.db.get(matched.matchedWith) : null;
        const isGameEnded = game?.status === "ENDED";

        if (!isGameEnded) {
          return {
            status: "matched",
            gameId: matched.gameId,
            opponent,
            game,
            betAmount: matched.betAmount,
          };
        }
      }

      const waitingGames = await ctx.db
        .query("games")
        .withIndex("by_status", (q) => q.eq("status", "WAITING"))
        .collect();

      const userGame = waitingGames.find((game) =>
        game.players.some((p) => p.userId === args.userId)
      );

      if (userGame && userGame.mode !== "AI") {
        const opponent = userGame.players.find((p) => p.userId !== args.userId);
        const opponentUser =
          opponent?.userId ? await ctx.db.get(opponent.userId) : null;

        return {
          status: "matched",
          gameId: userGame.gameId,
          opponent:
            opponentUser ?
              {
                _id: opponentUser._id,
                username: opponentUser.username,
                avatarUrl: opponentUser.avatarUrl,
                pr: opponentUser.pr,
              }
            : null,
          game: userGame,
          betAmount: userGame.bet.amount,
        };
      }

      return { status: "idle" };
    }

    return {
      status: "searching",
      betAmount: queueEntry.betAmount,
      joinedAt: queueEntry.joinedAt,
    };
  },
});

export const createMatchVsAI = mutation({
  args: {
    playerId: v.id("users"),
    betAmount: v.number(),
    currency: currencyValidator,
    difficulty: aiDifficultyValidator,
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) {
      throw new Error("Player not found");
    }

    if (args.betAmount > 0 && (player.balance || 0) < args.betAmount) {
      throw new Error("Insufficient balance");
    }

    const seed = crypto.randomUUID();
    const gameId = `game-${seed}`;
    const now = Date.now();

    const players: any[] = [
      {
        userId: args.playerId,
        username: player.username,
        type: "user",
        isConnected: true,
        avatar: player.avatarUrl,
        balance: 0,
      },
      {
        userId: null,
        botId: `ai-${
          args.difficulty === "easy" ? "bindi"
          : args.difficulty === "medium" ? "ndoss"
          : "bandi"
        }`,
        username:
          args.difficulty === "easy" ? "Bindi du Tierqua"
          : args.difficulty === "medium" ? "Le Ndoss"
          : "Le Grand Bandi",
        type: "ai",
        isConnected: true,
        balance: 0,
        aiDifficulty: args.difficulty,
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
        amount: args.betAmount,
        currency: args.currency,
      },
      winnerId: null as any,
      endReason: null as string | null,
      history: [
        {
          action: "game_created" as const,
          timestamp: now,
          playerId: args.playerId,
          data: {
            message: `Partie créée par ${player.username}`,
          },
        },
      ],
      mode: "AI" as const,
      competitive: false,
      maxPlayers: 2,
      aiDifficulty: args.difficulty,
      roomName: undefined,
      isPrivate: false,
      hostId: args.playerId,
      joinCode: undefined,
      startedAt: now,
      endedAt: null as number | null,
      lastUpdatedAt: now,
      victoryType: null as string | null,
      rematchGameId: undefined,
    };

    await ctx.db.insert("games", gameData as any);

    if (args.betAmount > 0) {
      await ctx.db.patch(args.playerId, {
        balance: (player.balance || 0) - args.betAmount,
      });

      await ctx.db.insert("transactions", {
        userId: args.playerId,
        type: "bet",
        amount: -args.betAmount,
        currency: args.currency,
        gameId,
        description: `Mise de ${args.betAmount} ${args.currency} pour la partie vs IA`,
        createdAt: Date.now(),
      });
    }

    return gameId;
  },
});

export const setMatchReady = mutation({
  args: {
    gameId: v.string(),
    playerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_game_id", (q) => q.eq("gameId", args.gameId))
      .first();

    if (!game) {
      throw new Error("Game not found");
    }

    const isPlayer1 = game.players[0]?.userId === args.playerId;
    const isPlayer2 = game.players[1]?.userId === args.playerId;

    if (!isPlayer1 && !isPlayer2) {
      throw new Error("Player not in game");
    }

    if (game.status !== "WAITING") {
      return { success: true, alreadyStarted: true };
    }

    await ctx.db.patch(game._id, {
      lastUpdatedAt: Date.now(),
    } as any);

    return { success: true };
  },
});
