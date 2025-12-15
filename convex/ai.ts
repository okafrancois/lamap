import { type Card } from "./game";

export type Difficulty = "easy" | "medium" | "hard";

export type TurnResult = {
  turn: number;
  winnerId: string;
  winningCard: Card;
};

function getPlayableCards(hand: Card[], leadSuit: string | null): Card[] {
  if (!leadSuit) {
    return hand;
  }

  const hasSuit = hand.some((c) => c.suit === leadSuit);
  if (hasSuit) {
    return hand.filter((c) => c.suit === leadSuit);
  }

  return hand;
}

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getLowestCard(cards: Card[]): Card {
  return cards.reduce((lowest, card) =>
    card.value < lowest.value ? card : lowest
  );
}

function getHighestCard(cards: Card[]): Card {
  return cards.reduce((highest, card) =>
    card.value > highest.value ? card : highest
  );
}

function canWinWith(card: Card, leadSuit: string | null): boolean {
  if (!leadSuit) return true;
  return card.suit === leadSuit;
}

function advancedStrategy(
  hand: Card[],
  leadSuit: string | null,
  turn: number,
  history: TurnResult[]
): Card {
  const playable = getPlayableCards(hand, leadSuit);

  if (turn === 5) {
    const three = playable.find((c) => c.value === 3);
    if (three && canWinWith(three, leadSuit)) {
      return three;
    }
    return getHighestCard(playable);
  }

  if (turn >= 3) {
    const nonThrees = playable.filter((c) => c.value !== 3);
    if (nonThrees.length > 0) {
      return getHighestCard(nonThrees);
    }
  }

  return getLowestCard(playable);
}

export function aiSelectCard(
  hand: Card[],
  leadSuit: string | null,
  turn: number,
  difficulty: Difficulty,
  gameHistory: TurnResult[]
): Card {
  const playableCards = getPlayableCards(hand, leadSuit);

  if (playableCards.length === 0) {
    return hand[0];
  }

  switch (difficulty) {
    case "easy":
      return randomChoice(playableCards);

    case "medium":
      if (turn < 4) {
        return getLowestCard(playableCards);
      }
      return getHighestCard(playableCards);

    case "hard":
      return advancedStrategy(hand, leadSuit, turn, gameHistory);
  }
}
