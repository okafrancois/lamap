import { v } from "convex/values";
import { query } from "./_generated/server";
import { getRankFromPR, RANK_TIERS } from "./ranking";

export const getGlobalLeaderboard = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 500;

    const players = await ctx.db
      .query("users")
      .withIndex("by_pr")
      .order("desc")
      .filter((q) =>
        q.and(
          q.neq(q.field("pr"), null),
          q.neq(q.field("pr"), undefined),
          q.gte(q.field("pr"), 0)
        )
      )
      .take(limit);

    return players.map((player, index) => ({
      rank: index + 1,
      userId: player._id,
      username: player.username,
      avatarUrl: player.avatarUrl,
      pr: player.pr || 0,
      rankTier: getRankFromPR(player.pr || 0),
      country: player.country,
    }));
  },
});

export const getRankLeaderboard = query({
  args: {
    rankTier: v.union(
      v.literal("BRONZE"),
      v.literal("SILVER"),
      v.literal("GOLD"),
      v.literal("PLATINUM"),
      v.literal("DIAMOND"),
      v.literal("MASTER"),
      v.literal("LEGEND")
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    const rankInfo = RANK_TIERS[args.rankTier];

    const players = await ctx.db
      .query("users")
      .withIndex("by_pr")
      .order("desc")
      .filter((q) =>
        q.and(
          q.neq(q.field("pr"), null),
          q.neq(q.field("pr"), undefined),
          q.gte(q.field("pr"), rankInfo.minPR),
          q.lte(q.field("pr"), rankInfo.maxPR)
        )
      )
      .take(limit);

    return players.map((player, index) => ({
      rank: index + 1,
      userId: player._id,
      username: player.username,
      avatarUrl: player.avatarUrl,
      pr: player.pr || 0,
      rankTier: getRankFromPR(player.pr || 0),
      country: player.country,
    }));
  },
});

export const getPlayerRank = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.userId);
    if (!player || !player.pr || player.pr === null) {
      return null;
    }

    const playerPR = player.pr;

    const playersAbove = await ctx.db
      .query("users")
      .withIndex("by_pr")
      .filter((q) =>
        q.and(
          q.neq(q.field("_id"), args.userId),
          q.neq(q.field("pr"), null),
          q.neq(q.field("pr"), undefined),
          q.gt(q.field("pr"), playerPR)
        )
      )
      .collect();

    const rank = playersAbove.length + 1;

    return {
      rank,
      userId: player._id,
      username: player.username,
      avatarUrl: player.avatarUrl,
      pr: playerPR,
      rankTier: getRankFromPR(playerPR),
      country: player.country,
    };
  },
});

export const getRankPlayerPosition = query({
  args: {
    userId: v.id("users"),
    rankTier: v.union(
      v.literal("BRONZE"),
      v.literal("SILVER"),
      v.literal("GOLD"),
      v.literal("PLATINUM"),
      v.literal("DIAMOND"),
      v.literal("MASTER"),
      v.literal("LEGEND")
    ),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.userId);
    if (!player || !player.pr || player.pr === null) {
      return null;
    }

    const rankInfo = RANK_TIERS[args.rankTier];
    const playerPR = player.pr;

    if (playerPR < rankInfo.minPR || playerPR > rankInfo.maxPR) {
      return null;
    }

    const playersAbove = await ctx.db
      .query("users")
      .withIndex("by_pr")
      .filter((q) =>
        q.and(
          q.neq(q.field("_id"), args.userId),
          q.neq(q.field("pr"), null),
          q.neq(q.field("pr"), undefined),
          q.gte(q.field("pr"), rankInfo.minPR),
          q.lte(q.field("pr"), rankInfo.maxPR),
          q.gt(q.field("pr"), playerPR)
        )
      )
      .collect();

    const rank = playersAbove.length + 1;

    return {
      rank,
      userId: player._id,
      username: player.username,
      avatarUrl: player.avatarUrl,
      pr: playerPR,
      rankTier: getRankFromPR(playerPR),
      country: player.country,
    };
  },
});

export const getLeaderboardStats = query({
  args: {},
  handler: async (ctx) => {
    const allPlayers = await ctx.db
      .query("users")
      .withIndex("by_pr")
      .filter((q) =>
        q.and(
          q.neq(q.field("pr"), null),
          q.neq(q.field("pr"), undefined),
          q.gte(q.field("pr"), 0)
        )
      )
      .collect();

    const totalPlayers = allPlayers.length;

    const distribution: Record<string, number> = {
      BRONZE: 0,
      SILVER: 0,
      GOLD: 0,
      PLATINUM: 0,
      DIAMOND: 0,
      MASTER: 0,
      LEGEND: 0,
    };

    for (const player of allPlayers) {
      if (player.pr !== null && player.pr !== undefined) {
        const rank = getRankFromPR(player.pr);
        distribution[rank.tier]++;
      }
    }

    return {
      totalPlayers,
      distribution,
    };
  },
});
