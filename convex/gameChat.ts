import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const sendGameMessage = mutation({
  args: {
    gameId: v.string(),
    playerId: v.union(v.id("users"), v.string()),
    playerUsername: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.message.trim()) {
      throw new Error("Message cannot be empty");
    }

    const game = await ctx.db
      .query("games")
      .withIndex("by_game_id", (q) => q.eq("gameId", args.gameId))
      .first();

    if (!game) {
      throw new Error("Game not found");
    }

    const isPlayerInGame = game.players.some((p) => {
      const playerId = p.userId || p.botId;
      return playerId === args.playerId;
    });

    if (!isPlayerInGame) {
      throw new Error("Player not in game");
    }

    const messageData = {
      gameId: args.gameId,
      playerId: args.playerId,
      playerUsername: args.playerUsername,
      message: args.message.trim(),
      timestamp: Date.now(),
    };

    await ctx.db.insert("gameMessages", messageData);

    return { success: true };
  },
});

export const getGameMessages = query({
  args: {
    gameId: v.string(),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("gameMessages")
      .withIndex("by_game_id_and_timestamp", (q) => q.eq("gameId", args.gameId))
      .order("asc")
      .collect();

    return messages;
  },
});
