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
  onboardingCompleted: v.optional(v.boolean()),
  tutorialCompleted: v.optional(v.boolean()),
  // Système de ranking
  pr: v.optional(v.number()), // Points de Rang (1000 par défaut) - arrondi à l'entier
  kora: v.optional(v.number()), // Tokens cosmétiques - arrondi à l'entier
  rankHistory: v.optional(v.array(v.string())), // Historique des rangs atteints (pour les récompenses)
})
  .index("by_clerk_id", ["clerkUserId"])
  .index("by_username", ["username"])
  .index("by_pr", ["pr"]); // Index pour le classement

const numbersTable = defineTable({
  value: v.number(),
});

// Table pour l'historique des changements de PR
const prHistoryTable = defineTable({
  userId: v.id("users"),
  oldPR: v.number(), // Arrondi à l'entier
  newPR: v.number(), // Arrondi à l'entier
  change: v.number(), // Arrondi à l'entier
  opponentId: v.id("users"),
  opponentPR: v.number(), // Arrondi à l'entier
  won: v.boolean(),
  gameId: v.optional(v.string()),
  timestamp: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_user_timestamp", ["userId", "timestamp"]);

// Games table - utilise les validators pour les enums
const gamesTable = defineTable({
  gameId: v.string(),
  seed: v.string(),
  version: v.number(), // S'incrémente à chaque mise à jour
  status: gameStatusValidator,
  currentRound: v.number(),
  maxRounds: v.number(),
  hasHandPlayerId: v.union(v.id("users"), v.string(), v.null()), // Utilise ai-bindi, ai-ndoss, ai-bandi pour l'IA
  currentTurnPlayerId: v.union(v.id("users"), v.string(), v.null()),
  players: v.array(playerValidator),
  playedCards: v.array(playedCardValidator),
  bet: betValidator,
  winnerId: v.union(v.id("users"), v.string(), v.null()),
  endReason: v.union(v.string(), v.null()),
  history: v.array(gameHistoryValidator), // Historique complet pour reconstituer la partie
  mode: gameModeValidator,
  competitive: v.optional(v.boolean()), // Pour les modes Cash: true = affecte le PR, false = ne l'affecte pas
  maxPlayers: v.number(),
  aiDifficulty: v.union(aiDifficultyValidator, v.null()),
  roomName: v.optional(v.string()),
  isPrivate: v.optional(v.boolean()),
  hostId: v.id("users"),
  joinCode: v.optional(v.string()),
  startedAt: v.number(),
  endedAt: v.union(v.number(), v.null()),
  lastUpdatedAt: v.number(), // Mis à jour à chaque action
  victoryType: v.union(victoryTypeValidator, v.null()),
  rematchGameId: v.optional(v.union(v.string(), v.null())), // ID de la partie rematch si créée
  // Timer de jeu (comme aux échecs)
  timerEnabled: v.optional(v.boolean()), // Si le timer est activé pour cette partie
  timerDuration: v.optional(v.number()), // Durée du timer par tour en secondes (ex: 30, 60, 120)
  playerTimers: v.optional(
    v.array(
      v.object({
        playerId: v.union(v.id("users"), v.string()),
        timeRemaining: v.number(), // Temps restant en secondes
        lastUpdated: v.number(), // Timestamp de la dernière mise à jour
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
  usedBy: v.optional(v.id("users")),
  usedAt: v.optional(v.number()),
  createdAt: v.number(),
  expiresAt: v.optional(v.number()),
  isActive: v.boolean(),
}).index("by_code", ["code"]);

// Table pour les amitiés
const friendshipsTable = defineTable({
  user1Id: v.id("users"), // Le premier utilisateur (ordre alphabétique des IDs pour éviter les doublons)
  user2Id: v.id("users"), // Le deuxième utilisateur
  createdAt: v.number(),
})
  .index("by_user1", ["user1Id"])
  .index("by_user2", ["user2Id"])
  .index("by_users", ["user1Id", "user2Id"]); // Index composé pour les requêtes bidirectionnelles

// Table pour les demandes d'amitié
const friendRequestsTable = defineTable({
  senderId: v.id("users"), // Celui qui envoie la demande
  receiverId: v.id("users"), // Celui qui reçoit la demande
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
});
