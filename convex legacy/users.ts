import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createOrUpdateUser = mutation({
  args: {
    clerkId: v.string(),
    username: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingUser) {
      return await ctx.db.patch(existingUser._id, {
        username: args.username,
        phone: args.phone,
        email: args.email,
      });
    }

    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      username: args.username,
      phone: args.phone,
      email: args.email,
      koraBalance: 0,
      totalWins: 0,
      totalLosses: 0,
      totalKoraWon: 0,
      totalKoraLost: 0,
      createdAt: Date.now(),
    });
  },
});

export const getCurrentUser = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

export const getUserById = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

