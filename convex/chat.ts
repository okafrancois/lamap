import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const sendMessage = mutation({
  args: {
    gameId: v.string(),
    playerId: v.union(v.id("users"), v.string()),
    playerUsername: v.string(),
    message: v.string(),
  },
  returns: v.id("gameMessages"),
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("gameMessages", {
      gameId: args.gameId,
      playerId: args.playerId,
      playerUsername: args.playerUsername,
      message: args.message,
      timestamp: Date.now(),
    });

    return messageId;
  },
});

export const getMessages = query({
  args: {
    gameId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("gameMessages"),
      _creationTime: v.number(),
      gameId: v.string(),
      playerId: v.union(v.id("users"), v.string()),
      playerUsername: v.string(),
      message: v.string(),
      timestamp: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    const messages = await ctx.db
      .query("gameMessages")
      .withIndex("by_game_id_and_timestamp", (q) => q.eq("gameId", args.gameId))
      .order("desc")
      .take(limit);

    return messages.reverse();
  },
});
