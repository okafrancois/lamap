import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const deductBet = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    matchId: v.optional(v.id("matches")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.koraBalance < args.amount) {
      throw new Error("Insufficient balance");
    }

    const newBalance = user.koraBalance - args.amount;

    await ctx.db.patch(args.userId, {
      koraBalance: newBalance,
      totalKoraLost: user.totalKoraLost + args.amount,
    });

    await ctx.db.insert("transactions", {
      userId: args.userId,
      type: "bet",
      amount: -args.amount,
      matchId: args.matchId,
      description: `Mise de ${args.amount} Kora${args.matchId ? ` pour le match` : ""}`,
      createdAt: Date.now(),
    });

    return { success: true, newBalance };
  },
});

export const creditWinnings = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    matchId: v.id("matches"),
    winType: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const newBalance = user.koraBalance + args.amount;

    await ctx.db.patch(args.userId, {
      koraBalance: newBalance,
      totalWins: user.totalWins + 1,
      totalKoraWon: user.totalKoraWon + args.amount,
    });

    await ctx.db.insert("transactions", {
      userId: args.userId,
      type: "win",
      amount: args.amount,
      matchId: args.matchId,
      description: `Gain de ${args.amount} Kora (${args.winType})`,
      createdAt: Date.now(),
    });

    return { success: true, newBalance };
  },
});

export const refundBet = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    matchId: v.optional(v.id("matches")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const newBalance = user.koraBalance + args.amount;

    await ctx.db.patch(args.userId, {
      koraBalance: newBalance,
    });

    await ctx.db.insert("transactions", {
      userId: args.userId,
      type: "bet",
      amount: args.amount,
      matchId: args.matchId,
      description: `Remboursement de ${args.amount} Kora`,
      createdAt: Date.now(),
    });

    return { success: true, newBalance };
  },
});

export const calculateWinnings = (
  totalBet: number,
  multiplier: number
): { winnings: number; platformFee: number } => {
  const platformFee = totalBet * 0.1;
  const winnings = (totalBet - platformFee) * multiplier;
  return { winnings, platformFee };
};

export const getTransactions = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    return transactions.map((tx) => ({
      ...tx,
      match: tx.matchId ? ctx.db.get(tx.matchId) : null,
    }));
  },
});

export const getTransactionHistory = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});
