import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

// Durées de timer prédéfinies (en secondes)
export const TIMER_DURATIONS = {
  BLITZ: 30, // 30 secondes par tour
  RAPID: 60, // 1 minute par tour
  CLASSIC: 120, // 2 minutes par tour
  EXTENDED: 300, // 5 minutes par tour
} as const;

export type TimerDuration = keyof typeof TIMER_DURATIONS;

// Initialiser les timers pour une partie
export const initializeTimers = internalMutation({
  args: {
    gameId: v.string(),
    timerDuration: v.number(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_game_id", (q) => q.eq("gameId", args.gameId))
      .first();

    if (!game) {
      throw new Error("Game not found");
    }

    const playerTimers = game.players.map((player) => ({
      playerId: player.userId || player.botId || "unknown",
      timeRemaining: args.timerDuration,
      lastUpdated: Date.now(),
    }));

    await ctx.db.patch(game._id, {
      timerEnabled: true,
      timerDuration: args.timerDuration,
      playerTimers,
    });

    return { success: true };
  },
});

// Mettre à jour le timer du joueur actuel
export const updatePlayerTimer = mutation({
  args: {
    gameId: v.string(),
    playerId: v.union(v.id("users"), v.string()),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_game_id", (q) => q.eq("gameId", args.gameId))
      .first();

    if (!game || !game.timerEnabled || !game.playerTimers) {
      return { success: false, message: "Timer not enabled" };
    }

    const now = Date.now();
    const playerTimer = game.playerTimers.find(
      (t) => t.playerId === args.playerId
    );

    if (!playerTimer) {
      return { success: false, message: "Player timer not found" };
    }

    // Calculer le temps écoulé depuis la dernière mise à jour
    const elapsedSeconds = Math.floor((now - playerTimer.lastUpdated) / 1000);
    const newTimeRemaining = Math.max(
      0,
      playerTimer.timeRemaining - elapsedSeconds
    );

    // Mettre à jour le timer du joueur
    const updatedTimers = game.playerTimers.map((t) =>
      t.playerId === args.playerId ?
        {
          ...t,
          timeRemaining: newTimeRemaining,
          lastUpdated: now,
        }
      : t
    );

    await ctx.db.patch(game._id, {
      playerTimers: updatedTimers,
      lastUpdatedAt: now,
    });

    // Si le temps est écoulé, le joueur perd automatiquement
    if (newTimeRemaining === 0) {
      return { success: true, timeExpired: true };
    }

    return {
      success: true,
      timeExpired: false,
      timeRemaining: newTimeRemaining,
    };
  },
});

// Vérifier si un joueur a dépassé son temps
export const checkTimeExpired = query({
  args: {
    gameId: v.string(),
    playerId: v.union(v.id("users"), v.string()),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_game_id", (q) => q.eq("gameId", args.gameId))
      .first();

    if (!game || !game.timerEnabled || !game.playerTimers) {
      return { expired: false };
    }

    const now = Date.now();
    const playerTimer = game.playerTimers.find(
      (t) => t.playerId === args.playerId
    );

    if (!playerTimer) {
      return { expired: false };
    }

    // Calculer le temps réel restant
    const elapsedSeconds = Math.floor((now - playerTimer.lastUpdated) / 1000);
    const actualTimeRemaining = Math.max(
      0,
      playerTimer.timeRemaining - elapsedSeconds
    );

    return {
      expired: actualTimeRemaining === 0,
      timeRemaining: actualTimeRemaining,
    };
  },
});

// Obtenir les timers de tous les joueurs
export const getGameTimers = query({
  args: {
    gameId: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_game_id", (q) => q.eq("gameId", args.gameId))
      .first();

    if (!game || !game.timerEnabled || !game.playerTimers) {
      return { enabled: false, timers: [] };
    }

    const now = Date.now();

    // Calculer les temps réels restants
    const timers = game.playerTimers.map((timer) => {
      const elapsedSeconds = Math.floor((now - timer.lastUpdated) / 1000);
      const actualTimeRemaining = Math.max(
        0,
        timer.timeRemaining - elapsedSeconds
      );

      return {
        playerId: timer.playerId,
        timeRemaining: actualTimeRemaining,
        lastUpdated: timer.lastUpdated,
      };
    });

    return {
      enabled: true,
      timerDuration: game.timerDuration || 60,
      timers,
      currentTurnPlayerId: game.currentTurnPlayerId,
    };
  },
});

// Pause le timer (pour les parties en attente ou terminées)
export const pauseTimer = mutation({
  args: {
    gameId: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_game_id", (q) => q.eq("gameId", args.gameId))
      .first();

    if (!game || !game.timerEnabled || !game.playerTimers) {
      return { success: false };
    }

    const now = Date.now();

    // Mettre à jour tous les timers avec le temps actuel
    const updatedTimers = game.playerTimers.map((timer) => {
      const elapsedSeconds = Math.floor((now - timer.lastUpdated) / 1000);
      const newTimeRemaining = Math.max(
        0,
        timer.timeRemaining - elapsedSeconds
      );

      return {
        ...timer,
        timeRemaining: newTimeRemaining,
        lastUpdated: now,
      };
    });

    await ctx.db.patch(game._id, {
      playerTimers: updatedTimers,
    });

    return { success: true };
  },
});
