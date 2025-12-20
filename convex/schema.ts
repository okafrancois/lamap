import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  aiDifficultyValidator,
  betValidator,
  gameChatMessageValidator,
  gameHistoryValidator,
  gameModeValidator,
  gameStatusValidator,
  playedCardValidator,
  playerValidator,
  victoryTypeValidator,
} from "./validators";

const usersTable = defineTable({
  firstName: v.optional(v.string()),
  lastName: v.optional(v.string()),
  email: v.string(),
  bio: v.optional(v.string()),
  avatarUrl: v.optional(v.string()),
  createdAt: v.number(),
  isActive: v.boolean(),
  username: v.string(),
  clerkUserId: v.string(),
  balance: v.optional(v.number()),
  currency: v.optional(v.string()),
  country: v.optional(v.string()),
  onboardingCompleted: v.boolean(),
  tutorialCompleted: v.optional(v.boolean()),
  pr: v.optional(v.number()),
  kora: v.optional(v.number()),
  rankHistory: v.optional(v.array(v.string())),
})
  .index("by_clerk_id", ["clerkUserId"])
  .index("by_username", ["username"])
  .index("by_pr", ["pr"]);

const numbersTable = defineTable({
  value: v.number(),
});

const prHistoryTable = defineTable({
  userId: v.id("users"),
  oldPR: v.number(),
  newPR: v.number(),
  change: v.number(),
  opponentId: v.id("users"),
  opponentPR: v.number(),
  won: v.boolean(),
  gameId: v.optional(v.string()),
  timestamp: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_user_timestamp", ["userId", "timestamp"]);

const gamesTable = defineTable({
  gameId: v.string(),
  seed: v.string(),
  version: v.number(),
  status: gameStatusValidator,
  currentRound: v.number(),
  maxRounds: v.number(),
  hasHandPlayerId: v.union(v.id("users"), v.string(), v.null()),
  currentTurnPlayerId: v.union(v.id("users"), v.string(), v.null()),
  players: v.array(playerValidator),
  playedCards: v.array(playedCardValidator),
  bet: betValidator,
  winnerId: v.union(v.id("users"), v.string(), v.null()),
  endReason: v.union(v.string(), v.null()),
  history: v.array(gameHistoryValidator),
  mode: gameModeValidator,
  competitive: v.optional(v.boolean()),
  maxPlayers: v.number(),
  aiDifficulty: v.union(aiDifficultyValidator, v.null()),
  roomName: v.optional(v.string()),
  isPrivate: v.optional(v.boolean()),
  hostId: v.id("users"),
  joinCode: v.optional(v.string()),
  startedAt: v.number(),
  endedAt: v.union(v.number(), v.null()),
  lastUpdatedAt: v.number(),
  victoryType: v.union(victoryTypeValidator, v.null()),
  rematchGameId: v.optional(v.union(v.string(), v.null())),
  timerEnabled: v.optional(v.boolean()),
  timerDuration: v.optional(v.number()),
  playerTimers: v.optional(
    v.array(
      v.object({
        playerId: v.union(v.id("users"), v.string()),
        timeRemaining: v.number(),
        lastUpdated: v.number(),
      })
    )
  ),
})
  .index("by_game_id", ["gameId"])
  .index("by_host", ["hostId"])
  .index("by_join_code", ["joinCode"])
  .index("by_status", ["status"]);

const gameMessagesTable = defineTable(gameChatMessageValidator)
  .index("by_game_id", ["gameId"])
  .index("by_game_id_and_timestamp", ["gameId", "timestamp"]);

const transactionsTable = defineTable({
  userId: v.id("users"),
  type: v.string(),
  amount: v.number(),
  currency: v.string(),
  gameId: v.optional(v.string()),
  description: v.string(),
  createdAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_user_currency", ["userId", "currency"]);

const matchmakingQueueTable = defineTable({
  userId: v.id("users"),
  betAmount: v.number(),
  currency: v.string(),
  status: v.string(),
  matchedWith: v.optional(v.id("users")),
  gameId: v.optional(v.string()),
  joinedAt: v.number(),
})
  .index("by_status_bet", ["status", "betAmount"])
  .index("by_status_bet_currency", ["status", "betAmount", "currency"]);

const conversationsTable = defineTable({
  participants: v.array(v.id("users")),
  lastMessageAt: v.number(),
  createdAt: v.number(),
}).index("by_last_message", ["lastMessageAt"]);

const messagesTable = defineTable({
  conversationId: v.id("conversations"),
  senderId: v.id("users"),
  content: v.string(),
  timestamp: v.number(),
  read: v.boolean(),
})
  .index("by_conversation", ["conversationId", "timestamp"])
  .index("by_sender", ["senderId"]);

const rechargeCodesTable = defineTable({
  code: v.string(),
  amount: v.number(),
  currency: v.string(),
  createdAt: v.number(),
  expiresAt: v.optional(v.number()),
  isActive: v.boolean(),
  maxUses: v.optional(v.number()),
  useCount: v.number(),
  usedByUserIds: v.array(v.id("users")),
}).index("by_code", ["code"]);

const friendshipsTable = defineTable({
  user1Id: v.id("users"),
  user2Id: v.id("users"),
  createdAt: v.number(),
})
  .index("by_user1", ["user1Id"])
  .index("by_user2", ["user2Id"])
  .index("by_users", ["user1Id", "user2Id"]);

const friendRequestsTable = defineTable({
  senderId: v.id("users"),
  receiverId: v.id("users"),
  status: v.union(
    v.literal("pending"),
    v.literal("accepted"),
    v.literal("rejected")
  ),
  createdAt: v.number(),
  respondedAt: v.optional(v.number()),
})
  .index("by_sender", ["senderId"])
  .index("by_receiver", ["receiverId"])
  .index("by_status", ["status"])
  .index("by_sender_receiver", ["senderId", "receiverId"]);

const challengesTable = defineTable({
  challengerId: v.id("users"),
  challengedId: v.id("users"),
  mode: v.union(v.literal("RANKED"), v.literal("CASH")),
  betAmount: v.optional(v.number()),
  currency: v.optional(v.string()),
  competitive: v.optional(v.boolean()),
  status: v.union(
    v.literal("pending"),
    v.literal("accepted"),
    v.literal("rejected"),
    v.literal("expired")
  ),
  createdAt: v.number(),
  expiresAt: v.number(),
  respondedAt: v.optional(v.number()),
  gameId: v.optional(v.string()),
})
  .index("by_challenger", ["challengerId"])
  .index("by_challenged", ["challengedId"])
  .index("by_status", ["status"]);

export default defineSchema({
  numbers: numbersTable,
  users: usersTable,
  games: gamesTable,
  gameMessages: gameMessagesTable,
  transactions: transactionsTable,
  matchmakingQueue: matchmakingQueueTable,
  conversations: conversationsTable,
  messages: messagesTable,
  rechargeCodes: rechargeCodesTable,
  prHistory: prHistoryTable,
  friendships: friendshipsTable,
  friendRequests: friendRequestsTable,
  challenges: challengesTable,
});
