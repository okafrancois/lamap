import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const joinQueue = mutation({
  args: {
    userId: v.id("users"),
    betAmount: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("matchmakingQueue")
      .withIndex("by_status_bet", (q) =>
        q.eq("status", "searching").eq("betAmount", args.betAmount)
      )
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (existing) {
      return existing._id;
    }

    const queueEntry = await ctx.db.insert("matchmakingQueue", {
      userId: args.userId,
      betAmount: args.betAmount,
      status: "searching",
      joinedAt: Date.now(),
    });

    const potentialMatch = await ctx.db
      .query("matchmakingQueue")
      .withIndex("by_status_bet", (q) =>
        q.eq("status", "searching").eq("betAmount", args.betAmount)
      )
      .filter((q) => q.neq(q.field("userId"), args.userId))
      .first();

    if (potentialMatch) {
      const player1 = await ctx.db.get(args.userId);
      const player2 = await ctx.db.get(potentialMatch.userId);

      if (!player1 || !player2) {
        throw new Error("Players not found");
      }

      if (player1.koraBalance < args.betAmount || player2.koraBalance < args.betAmount) {
        throw new Error("Insufficient balance");
      }

      const matchId = await ctx.db.insert("matches", {
        player1Id: args.userId,
        player2Id: potentialMatch.userId,
        isVsAI: false,
        betAmount: args.betAmount,
        status: "waiting",
        koraMultiplier: 1,
        currentTurn: 0,
        createdAt: Date.now(),
      });

      await ctx.db.patch(args.userId, {
        koraBalance: player1.koraBalance - args.betAmount,
        totalKoraLost: player1.totalKoraLost + args.betAmount,
      });

      await ctx.db.patch(potentialMatch.userId, {
        koraBalance: player2.koraBalance - args.betAmount,
        totalKoraLost: player2.totalKoraLost + args.betAmount,
      });

      await ctx.db.insert("transactions", {
        userId: args.userId,
        type: "bet",
        amount: -args.betAmount,
        matchId,
        description: `Mise de ${args.betAmount} Kora pour le match`,
        createdAt: Date.now(),
      });

      await ctx.db.insert("transactions", {
        userId: potentialMatch.userId,
        type: "bet",
        amount: -args.betAmount,
        matchId,
        description: `Mise de ${args.betAmount} Kora pour le match`,
        createdAt: Date.now(),
      });

      await ctx.db.patch(queueEntry, {
        status: "matched",
        matchedWith: potentialMatch.userId,
        matchId,
      });

      await ctx.db.patch(potentialMatch._id, {
        status: "matched",
        matchedWith: args.userId,
        matchId,
      });

      return { matched: true, matchId, queueId: queueEntry };
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
    }

    return { success: true };
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

      if (matched && matched.matchId) {
        const match = await ctx.db.get(matched.matchId);
        const opponent = matched.matchedWith
          ? await ctx.db.get(matched.matchedWith)
          : null;

        return {
          status: "matched",
          matchId: matched.matchId,
          opponent,
          match,
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
    difficulty: v.string(),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) {
      throw new Error("Player not found");
    }

    if (player.koraBalance < args.betAmount) {
      throw new Error("Insufficient balance");
    }

    const matchId = await ctx.db.insert("matches", {
      player1Id: args.playerId,
      player2Id: undefined,
      isVsAI: true,
      aiDifficulty: args.difficulty,
      betAmount: args.betAmount,
      status: "ready",
      koraMultiplier: 1,
      currentTurn: 0,
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.playerId, {
      koraBalance: player.koraBalance - args.betAmount,
      totalKoraLost: player.totalKoraLost + args.betAmount,
    });

    await ctx.db.insert("transactions", {
      userId: args.playerId,
      type: "bet",
      amount: -args.betAmount,
      matchId,
      description: `Mise de ${args.betAmount} Kora pour le match vs IA`,
      createdAt: Date.now(),
    });

    return matchId;
  },
});

export const setMatchReady = mutation({
  args: {
    matchId: v.id("matches"),
    playerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    if (match.status !== "waiting") {
      throw new Error("Match is not in waiting state");
    }

    const isPlayer1 = match.player1Id === args.playerId;
    const isPlayer2 = match.player2Id === args.playerId;

    if (!isPlayer1 && !isPlayer2) {
      throw new Error("Player not in match");
    }

    if (match.status === "waiting") {
      await ctx.db.patch(args.matchId, {
        status: "ready",
      });
    }

    return { success: true };
  },
});

