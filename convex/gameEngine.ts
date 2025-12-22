import { Doc, Id } from "./_generated/dataModel";
import { Card, GameHistory, PlayedCard, Player } from "./validators";

export type Game = Doc<"games">;
export type User = Doc<"users">;

export function createDeck(seed: string): Card[] {
  const suits: Card["suit"][] = ["hearts", "diamonds", "clubs", "spades"];
  const ranks: Card["rank"][] = ["3", "4", "5", "6", "7", "8", "9"];
  const deck: Card[] = [];

  suits.forEach((suit) => {
    ranks.forEach((rank) => {
      if (suit === "spades" && rank === "9") {
        return;
      }

      deck.push({
        suit,
        rank,
        playable: false,
        id: `${suit}-${rank}-${seed}-${suits.indexOf(suit) * 8 + ranks.indexOf(rank)}`,
      });
    });
  });

  return shuffleDeck(deck);
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = shuffled[i];
    shuffled[i] = shuffled[j]!;
    shuffled[j] = temp;
  }
  return shuffled;
}

export function getCardValue(rank: Card["rank"]): number {
  switch (rank) {
    case "9":
      return 9;
    case "8":
      return 8;
    case "7":
      return 7;
    case "6":
      return 6;
    case "5":
      return 5;
    case "4":
      return 4;
    case "3":
      return 3;
    default:
      return parseInt(rank);
  }
}

export function calculateHandSum(cards: Card[]): number {
  return cards.reduce((sum, card) => sum + getCardValue(card.rank), 0);
}

export function canPlayCard(
  cardId: string,
  player: Player,
  game: Game
): boolean {
  if (game.status !== "PLAYING") return false;
  if (game.currentTurnPlayerId !== getPlayerId(player)) return false;

  const card = player.hand?.find((c) => c.id === cardId);
  if (!card) return false;

  if (game.hasHandPlayerId === getPlayerId(player)) {
    return true;
  }

  const currentRoundCards = game.playedCards.filter(
    (p) => p.round === game.currentRound
  );

  if (currentRoundCards.length === 0) {
    return true;
  }

  const firstRoundCard = currentRoundCards[0];
  if (!firstRoundCard) return true;

  const opponentCard = firstRoundCard.card;
  const requiredSuit = opponentCard.suit;
  const hasRequiredSuit = player.hand?.some((c) => c.suit === requiredSuit);

  if (hasRequiredSuit) {
    return card.suit === requiredSuit;
  }

  return true;
}

export function updatePlayableCards(game: Game): Game {
  const updatedPlayers = game.players.map((player) => ({
    ...player,
    hand: player.hand?.map((card) => ({
      ...card,
      playable: canPlayCard(card.id, player, game),
    })),
  }));

  return {
    ...game,
    players: updatedPlayers,
  };
}

export function determineRoundWinner(
  firstCard: PlayedCard,
  secondCard: PlayedCard,
  hasHandPlayerId: Id<"users"> | string
): Id<"users"> | string {
  if (firstCard.card.suit === secondCard.card.suit) {
    const firstValue = getCardValue(firstCard.card.rank);
    const secondValue = getCardValue(secondCard.card.rank);
    return secondValue > firstValue ? secondCard.playerId : firstCard.playerId;
  } else {
    return hasHandPlayerId;
  }
}

export function checkAutomaticVictory(
  firstPlayerHand: Card[],
  secondPlayerHand: Card[]
): {
  hasVictory: boolean;
  winnerId: string | null;
  reason: string | null;
  playerIndex: 0 | 1 | null;
} {
  const firstPlayerSevens = firstPlayerHand.filter(
    (card) => card.rank === "7"
  ).length;
  const secondPlayerSevens = secondPlayerHand.filter(
    (card) => card.rank === "7"
  ).length;

  if (firstPlayerSevens >= 3 || secondPlayerSevens >= 3) {
    if (firstPlayerSevens >= 3 && secondPlayerSevens >= 3) {
      const playerIndex =
        firstPlayerSevens > secondPlayerSevens ? 0
        : firstPlayerSevens < secondPlayerSevens ? 1
        : 0;
      return {
        hasVictory: true,
        winnerId: null,
        reason: `Victoire avec ${Math.max(firstPlayerSevens, secondPlayerSevens)} cartes de 7`,
        playerIndex,
      };
    } else if (firstPlayerSevens >= 3) {
      return {
        hasVictory: true,
        winnerId: null,
        reason: `Victoire avec ${firstPlayerSevens} cartes de 7`,
        playerIndex: 0,
      };
    } else {
      return {
        hasVictory: true,
        winnerId: null,
        reason: `Victoire avec ${secondPlayerSevens} cartes de 7`,
        playerIndex: 1,
      };
    }
  }

  const firstPlayerSum = calculateHandSum(firstPlayerHand);
  const secondPlayerSum = calculateHandSum(secondPlayerHand);

  if (firstPlayerSum < 21 || secondPlayerSum < 21) {
    if (firstPlayerSum < 21 && secondPlayerSum < 21) {
      const playerIndex = firstPlayerSum < secondPlayerSum ? 0 : 1;
      return {
        hasVictory: true,
        winnerId: null,
        reason: `Somme la plus faible (${Math.min(firstPlayerSum, secondPlayerSum)})`,
        playerIndex,
      };
    } else if (firstPlayerSum < 21) {
      return {
        hasVictory: true,
        winnerId: null,
        reason: `Somme < 21 (${firstPlayerSum})`,
        playerIndex: 0,
      };
    } else {
      return {
        hasVictory: true,
        winnerId: null,
        reason: `Somme < 21 (${secondPlayerSum})`,
        playerIndex: 1,
      };
    }
  }

  return {
    hasVictory: false,
    winnerId: null,
    reason: null,
    playerIndex: null,
  };
}

export function countConsecutiveThrees(cardRanks: string[]): number {
  let maxConsecutive = 0;
  let currentConsecutive = 0;

  for (const rank of cardRanks) {
    if (rank === "3") {
      currentConsecutive++;
      maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
    } else {
      currentConsecutive = 0;
    }
  }

  return maxConsecutive;
}

export function calculateKoraMultiplier(consecutiveThrees: number): number {
  if (consecutiveThrees >= 3) return 3;
  if (consecutiveThrees >= 2) return 2;
  if (consecutiveThrees >= 1) return 1.5;
  return 1;
}

export function getKoraType(
  consecutiveThrees: number
): "normal" | "simple_kora" | "double_kora" | "triple_kora" {
  if (consecutiveThrees >= 3) return "triple_kora";
  if (consecutiveThrees >= 2) return "double_kora";
  if (consecutiveThrees >= 1) return "simple_kora";
  return "normal";
}

export function updatePlayerTurn(game: Game): Id<"users"> | string | null {
  const currentRoundCards = game.playedCards.filter(
    (p) => p.round === game.currentRound
  );

  if (currentRoundCards.length === 0) {
    return game.hasHandPlayerId;
  } else if (currentRoundCards.length === 1) {
    const firstPlayerId = currentRoundCards[0].playerId;
    const otherPlayer = game.players.find(
      (p) => getPlayerId(p) !== firstPlayerId
    );
    return otherPlayer ? getPlayerId(otherPlayer) : null;
  } else {
    return null;
  }
}

export function validatePlayCardAction(
  cardId: string,
  playerId: Id<"users"> | string,
  game: Game
): { valid: boolean; error?: string } {
  if (game.status !== "PLAYING") {
    return { valid: false, error: "La partie n'est pas en cours" };
  }

  const player = game.players.find((p) => getPlayerId(p) === playerId);
  if (!player) {
    return { valid: false, error: "Joueur non trouvé" };
  }

  if (game.currentTurnPlayerId !== playerId) {
    return { valid: false, error: "Ce n'est pas le tour de ce joueur" };
  }

  const card = player.hand?.find((c) => c.id === cardId);
  if (!card) {
    return { valid: false, error: "Carte non trouvée" };
  }

  if (!canPlayCard(cardId, player, game)) {
    return { valid: false, error: "Cette carte n'est pas playable" };
  }

  const roundCards = game.playedCards.filter(
    (p) => p.round === game.currentRound
  );
  const cardAlreadyPlayed = roundCards.some(
    (playedCard) =>
      playedCard.card.id === cardId && playedCard.playerId === playerId
  );

  if (cardAlreadyPlayed) {
    return { valid: false, error: "Carte déjà jouée ce tour" };
  }

  return { valid: true };
}

const AI_BOT_IDS = {
  easy: "ai-bindi",
  medium: "ai-ndoss",
  hard: "ai-bandi",
} as const;

const AI_BOT_NAMES = {
  easy: "Bindi du Tierqua",
  medium: "Le Ndoss",
  hard: "Le Grand Bandi",
} as const;

export function getAIBotId(difficulty: "easy" | "medium" | "hard"): string {
  return AI_BOT_IDS[difficulty];
}

export function getAIBotUsername(
  difficulty: "easy" | "medium" | "hard"
): string {
  return AI_BOT_NAMES[difficulty];
}

export function getPlayerId(player: Player): Id<"users"> | string {
  return player.userId ?? player.botId ?? getAIBotId(player.aiDifficulty!);
}

export function addHistoryEntry(
  game: Game,
  action:
    | "game_created"
    | "game_started"
    | "card_played"
    | "round_won"
    | "kora_achieved"
    | "game_ended"
    | "player_joined"
    | "player_left",
  playerId?: Id<"users"> | string,
  data?: GameHistory["data"]
): Game {
  const entry: GameHistory = {
    action: action as any,
    timestamp: Date.now(),
    playerId,
    data,
  };

  return {
    ...game,
    history: [...game.history, entry],
    version: game.version + 1,
    lastUpdatedAt: Date.now(),
  };
}
