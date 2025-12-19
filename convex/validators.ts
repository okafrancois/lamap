import { Infer, v } from "convex/values";

// Validators avec valeurs littérales directes
export const gameStatusValidator = v.union(
  v.literal("WAITING"),
  v.literal("PLAYING"),
  v.literal("ENDED")
);

export const playerTypeValidator = v.union(v.literal("user"), v.literal("ai"));

export const aiDifficultyValidator = v.union(
  v.literal("easy"),
  v.literal("medium"),
  v.literal("hard")
);

export const gameModeValidator = v.union(
  v.literal("AI"),
  v.literal("ONLINE"),
  v.literal("LOCAL")
);

export const currencyValidator = v.union(
  v.literal("XAF"),
  v.literal("EUR"),
  v.literal("USD")
);

export const suitValidator = v.union(
  v.literal("hearts"),
  v.literal("diamonds"),
  v.literal("clubs"),
  v.literal("spades")
);

export const rankValidator = v.union(
  v.literal("3"),
  v.literal("4"),
  v.literal("5"),
  v.literal("6"),
  v.literal("7"),
  v.literal("8"),
  v.literal("9"),
  v.literal("10")
);

export const victoryTypeValidator = v.union(
  v.literal("normal"),
  v.literal("auto_sum"),
  v.literal("auto_lowest"),
  v.literal("auto_sevens"),
  v.literal("simple_kora"),
  v.literal("double_kora"),
  v.literal("triple_kora")
);

export const gameHistoryActionValidator = v.union(
  v.literal("game_created"),
  v.literal("game_started"),
  v.literal("card_played"),
  v.literal("round_won"),
  v.literal("kora_achieved"),
  v.literal("game_ended"),
  v.literal("player_joined"),
  v.literal("player_left")
);

// Card validator
export const cardValidator = v.object({
  id: v.string(),
  suit: suitValidator,
  rank: rankValidator,
  playable: v.boolean(),
});

// Bet validator
export const betValidator = v.object({
  amount: v.number(),
  currency: currencyValidator,
});

// Player validator
export const playerValidator = v.object({
  userId: v.union(v.id("users"), v.null()),
  botId: v.optional(v.string()), // ID du bot (ai-bindi, ai-ndoss, ai-bandi) pour les joueurs IA
  username: v.string(),
  type: playerTypeValidator,
  isConnected: v.boolean(),
  avatar: v.optional(v.string()),
  hand: v.optional(v.array(cardValidator)),
  balance: v.number(),
  aiDifficulty: v.optional(aiDifficultyValidator),
  isThinking: v.optional(v.boolean()),
});

// Played card validator
export const playedCardValidator = v.object({
  card: cardValidator,
  playerId: v.union(v.id("users"), v.string()),
  round: v.number(),
  timestamp: v.number(),
});

// Game history entry validator - historique complet pour reconstituer la partie
export const gameHistoryValidator = v.object({
  action: gameHistoryActionValidator,
  timestamp: v.number(),
  playerId: v.optional(v.union(v.id("users"), v.string())),
  data: v.optional(
    v.object({
      cardId: v.optional(v.string()),
      cardSuit: v.optional(suitValidator),
      cardRank: v.optional(rankValidator),
      round: v.optional(v.number()),
      winnerId: v.optional(v.union(v.id("users"), v.string())),
      koraType: v.optional(v.string()),
      multiplier: v.optional(v.number()),
      message: v.optional(v.string()),
    })
  ),
});

export const gameChatMessageValidator = v.object({
  gameId: v.string(),
  playerId: v.union(v.id("users"), v.string()),
  playerUsername: v.string(),
  message: v.string(),
  timestamp: v.number(),
});

export type Rank = Infer<typeof rankValidator>;
export type Suit = Infer<typeof suitValidator>;
