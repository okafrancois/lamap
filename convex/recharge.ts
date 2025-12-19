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

    if (rechargeCode.usedBy) {
      throw new Error("Ce code de recharge a déjà été utilisé");
    }

    if (rechargeCode.expiresAt && rechargeCode.expiresAt < Date.now()) {
      throw new Error("Ce code de recharge a expiré");
    }

    const currentBalance = user.balance || 0;
    const newBalance = currentBalance + rechargeCode.amount;

    await ctx.db.patch(args.userId, {
      balance: newBalance,
    });

    await ctx.db.patch(rechargeCode._id, {
      usedBy: args.userId,
      usedAt: Date.now(),
      isActive: false,
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
  },
  handler: async (ctx, args) => {
    const rechargeCode = await ctx.db
      .query("rechargeCodes")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();

    if (!rechargeCode) {
      return null;
    }

    return {
      amount: rechargeCode.amount,
      currency: rechargeCode.currency,
      isValid:
        rechargeCode.isActive &&
        !rechargeCode.usedBy &&
        (!rechargeCode.expiresAt || rechargeCode.expiresAt >= Date.now()),
      isUsed: !!rechargeCode.usedBy,
      isExpired:
        rechargeCode.expiresAt ? rechargeCode.expiresAt < Date.now() : false,
    };
  },
});

export const createRechargeCode = internalMutation({
  args: {
    code: v.string(),
    amount: v.number(),
    currency: v.string(),
    expiresAt: v.optional(v.number()),
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
    });

    return rechargeCodeId;
  },
});
