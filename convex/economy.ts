import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const deductBet = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    gameId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const currentBalance = user.balance || 0;
    if (currentBalance < args.amount) {
      throw new Error("Insufficient balance");
    }

    const newBalance = currentBalance - args.amount;

    await ctx.db.patch(args.userId, {
      balance: newBalance,
    });

    await ctx.db.insert("transactions", {
      userId: args.userId,
      type: "bet",
      amount: -args.amount,
      currency: user.currency || "XAF",
      gameId: args.gameId,
      description: `Mise de ${args.amount} ${user.currency || "XAF"}${args.gameId ? ` pour la partie` : ""}`,
      createdAt: Date.now(),
    });

    return { success: true, newBalance };
  },
});

export const creditWinnings = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    gameId: v.string(),
    winType: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const currentBalance = user.balance || 0;
    const newBalance = currentBalance + args.amount;

    await ctx.db.patch(args.userId, {
      balance: newBalance,
    });

    await ctx.db.insert("transactions", {
      userId: args.userId,
      type: "win",
      amount: args.amount,
      currency: user.currency || "XAF",
      gameId: args.gameId,
      description: `Gain de ${args.amount} ${user.currency || "XAF"} (${args.winType})`,
      createdAt: Date.now(),
    });

    return { success: true, newBalance };
  },
});

export const refundBet = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    gameId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const currentBalance = user.balance || 0;
    const newBalance = currentBalance + args.amount;

    await ctx.db.patch(args.userId, {
      balance: newBalance,
    });

    await ctx.db.insert("transactions", {
      userId: args.userId,
      type: "bet",
      amount: args.amount,
      currency: user.currency || "XAF",
      gameId: args.gameId,
      description: `Remboursement de ${args.amount} ${user.currency || "XAF"}`,
      createdAt: Date.now(),
    });

    return { success: true, newBalance };
  },
});

export const calculateWinnings = (
  totalBet: number,
  multiplier: number
): { winnings: number; platformFee: number } => {
  const platformFee = totalBet * 0.02;
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

    return transactions;
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

