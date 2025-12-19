import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

export const redeemRechargeCode = mutation({
  args: {
    userId: v.id("users"),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const rechargeCode = await ctx.db
      .query("rechargeCodes")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();

    if (!rechargeCode) {
      throw new Error("Code de recharge invalide");
    }

    if (!rechargeCode.isActive) {
      throw new Error("Ce code de recharge n'est plus actif");
    }

    if (rechargeCode.expiresAt && rechargeCode.expiresAt < Date.now()) {
      throw new Error("Ce code de recharge a expiré");
    }

    if (
      rechargeCode.maxUses !== undefined &&
      rechargeCode.useCount >= rechargeCode.maxUses
    ) {
      throw new Error("Ce code de recharge a atteint sa limite d'utilisations");
    }

    const existingUsage = await ctx.db
      .query("rechargeCodeUsages")
      .withIndex("by_user_code", (q) =>
        q.eq("userId", args.userId).eq("rechargeCodeId", rechargeCode._id)
      )
      .first();

    if (existingUsage) {
      throw new Error("Vous avez déjà utilisé ce code de recharge");
    }

    const currentBalance = user.balance || 0;
    const newBalance = currentBalance + rechargeCode.amount;

    await ctx.db.patch(args.userId, {
      balance: newBalance,
    });

    const newUseCount = (rechargeCode.useCount || 0) + 1;
    const shouldDeactivate =
      rechargeCode.maxUses !== undefined && newUseCount >= rechargeCode.maxUses;

    await ctx.db.patch(rechargeCode._id, {
      useCount: newUseCount,
      isActive: !shouldDeactivate,
    });

    await ctx.db.insert("rechargeCodeUsages", {
      rechargeCodeId: rechargeCode._id,
      userId: args.userId,
      usedAt: Date.now(),
      amount: rechargeCode.amount,
      currency: rechargeCode.currency,
    });

    await ctx.db.insert("transactions", {
      userId: args.userId,
      type: "deposit",
      amount: rechargeCode.amount,
      currency: rechargeCode.currency,
      description: `Recharge via code: ${rechargeCode.amount} ${rechargeCode.currency}`,
      createdAt: Date.now(),
    });

    return {
      success: true,
      amount: rechargeCode.amount,
      currency: rechargeCode.currency,
      newBalance,
    };
  },
});

export const getRechargeCode = query({
  args: {
    code: v.string(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const rechargeCode = await ctx.db
      .query("rechargeCodes")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();

    if (!rechargeCode) {
      return null;
    }

    const isExpired =
      rechargeCode.expiresAt ? rechargeCode.expiresAt < Date.now() : false;

    const hasReachedLimit =
      rechargeCode.maxUses !== undefined &&
      rechargeCode.useCount >= rechargeCode.maxUses;

    let hasUserUsed = false;
    if (args.userId) {
      const existingUsage = await ctx.db
        .query("rechargeCodeUsages")
        .withIndex("by_user_code", (q) =>
          q.eq("userId", args.userId!).eq("rechargeCodeId", rechargeCode._id)
        )
        .first();
      hasUserUsed = !!existingUsage;
    }

    const isValid =
      rechargeCode.isActive && !isExpired && !hasReachedLimit && !hasUserUsed;

    return {
      amount: rechargeCode.amount,
      currency: rechargeCode.currency,
      maxUses: rechargeCode.maxUses,
      useCount: rechargeCode.useCount,
      remainingUses:
        rechargeCode.maxUses !== undefined ?
          Math.max(0, rechargeCode.maxUses - rechargeCode.useCount)
        : null,
      hasUserUsed,
      isValid,
      isExpired,
    };
  },
});

export const createRechargeCode = internalMutation({
  args: {
    code: v.string(),
    amount: v.number(),
    currency: v.string(),
    expiresAt: v.optional(v.number()),
    maxUses: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("rechargeCodes")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();

    if (existing) {
      throw new Error("Ce code existe déjà");
    }

    const rechargeCodeId = await ctx.db.insert("rechargeCodes", {
      code: args.code.toUpperCase(),
      amount: args.amount,
      currency: args.currency,
      createdAt: Date.now(),
      expiresAt: args.expiresAt,
      isActive: true,
      maxUses: args.maxUses,
      useCount: 0,
    });

    return rechargeCodeId;
  },
});
