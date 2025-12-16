import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  
  users: defineTable({
    clerkId: v.string(),
    username: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    koraBalance: v.number(),
    totalWins: v.number(),
    totalLosses: v.number(),
    totalKoraWon: v.number(),
    totalKoraLost: v.number(),
    createdAt: v.number(),
  }).index("by_clerk", ["clerkId"]),

  matches: defineTable({
    player1Id: v.id("users"),
    player2Id: v.optional(v.id("users")),
    isVsAI: v.boolean(),
    aiDifficulty: v.optional(v.string()),
    betAmount: v.number(),
    status: v.string(),
    winnerId: v.optional(v.id("users")),
    winType: v.optional(v.string()),
    koraMultiplier: v.number(),
    currentTurn: v.number(),
    currentPlayerId: v.optional(v.id("users")),
    leadSuit: v.optional(v.string()),
    createdAt: v.number(),
    finishedAt: v.optional(v.number()),
  }).index("by_status", ["status"]),

  hands: defineTable({
    matchId: v.id("matches"),
    playerId: v.id("users"),
    cards: v.array(v.object({
      suit: v.string(),
      value: v.number(),
    })),
  }).index("by_match", ["matchId"]),

  plays: defineTable({
    matchId: v.id("matches"),
    turn: v.number(),
    playerId: v.id("users"),
    card: v.object({
      suit: v.string(),
      value: v.number(),
    }),
    playedAt: v.number(),
  }).index("by_match_turn", ["matchId", "turn"]),

  turnResults: defineTable({
    matchId: v.id("matches"),
    turn: v.number(),
    winnerId: v.id("users"),
    winningCard: v.object({
      suit: v.string(),
      value: v.number(),
    }),
    loserId: v.optional(v.id("users")),
    losingCard: v.optional(v.object({
      suit: v.string(),
      value: v.number(),
    })),
  }).index("by_match", ["matchId"]),

  transactions: defineTable({
    userId: v.id("users"),
    type: v.string(),
    amount: v.number(),
    matchId: v.optional(v.id("matches")),
    description: v.string(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  matchmakingQueue: defineTable({
    userId: v.id("users"),
    betAmount: v.number(),
    status: v.string(),
    matchedWith: v.optional(v.id("users")),
    matchId: v.optional(v.id("matches")),
    joinedAt: v.number(),
  }).index("by_status_bet", ["status", "betAmount"]),

});

