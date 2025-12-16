export type Card = {
  suit: "spade" | "heart" | "diamond" | "club";
  value: number;
};

export type Play = {
  playerId: string;
  card: Card;
};

export type TurnResult = {
  turn: number;
  winnerId: string;
  winningCard: Card;
  loserId?: string;
  losingCard?: Card;
};

const DECK_VALUES = [3, 4, 5, 6, 7, 8, 9, 10];
const SUITS: Card["suit"][] = ["spade", "heart", "diamond", "club"];
const EXCLUDED_CARD: Card = { suit: "spade", value: 10 };

function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function generateDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const value of DECK_VALUES) {
      if (!(suit === EXCLUDED_CARD.suit && value === EXCLUDED_CARD.value)) {
        deck.push({ suit, value });
      }
    }
  }
  return shuffle(deck);
}

export function dealCards(deck: Card[]): { hand1: Card[]; hand2: Card[] } {
  return {
    hand1: deck.slice(0, 5),
    hand2: deck.slice(5, 10),
  };
}

export function checkAutoWin(hand: Card[]): string | null {
  const sum = hand.reduce((acc, card) => acc + card.value, 0);
  if (sum < 21) return "main_faible";

  const sevens = hand.filter((card) => card.value === 7);
  if (sevens.length >= 3) return "triple_7";

  return null;
}

export function isValidPlay(
  hand: Card[],
  card: Card,
  leadSuit: string | null
): boolean {
  if (!leadSuit) return true;

  const hasSuit = hand.some((c) => c.suit === leadSuit);
  if (hasSuit) {
    return card.suit === leadSuit;
  }
  return true;
}

export function getTurnWinner(
  play1: Play,
  play2: Play,
  leadSuit: string
): Play {
  if (play1.card.suit !== leadSuit && play2.card.suit === leadSuit) {
    return play2;
  }
  if (play2.card.suit !== leadSuit && play1.card.suit === leadSuit) {
    return play1;
  }
  return play1.card.value > play2.card.value ? play1 : play2;
}

export function calculateKoraMultiplier(turnResults: TurnResult[]): number {
  if (turnResults.length < 5) return 1;

  const lastThree = turnResults.slice(-3);

  if (
    lastThree.length === 3 &&
    lastThree.every((t) => t.winningCard.value === 3)
  ) {
    return 8;
  }

  const lastTwo = turnResults.slice(-2);
  if (lastTwo.length === 2 && lastTwo.every((t) => t.winningCard.value === 3)) {
    return 4;
  }

  const lastTurn = turnResults[4];
  if (lastTurn && lastTurn.winningCard.value === 3) {
    return 2;
  }

  return 1;
}

export const SUIT_COLORS = {
  spade: "#1A1A1A",
  club: "#1A1A1A",
  heart: "#B4443E",
  diamond: "#B4443E",
};

export const SUIT_SYMBOLS = {
  spade: "♠",
  club: "♣",
  heart: "♥",
  diamond: "♦",
};
