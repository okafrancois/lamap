import { Card, getCardValue as engineGetCardValue } from "../gameEngine";
import { Rank, Suit } from "../validators";

export function shuffle<T>(array: T[]): T[] {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getCardValue(rank: Rank): number {
  return engineGetCardValue(rank);
}

export function isKora(card: Card): boolean {
  return card.rank === "3";
}

export function highestCard(cards: Card[]): Card {
  if (cards.length === 0) {
    throw new Error("highestCard called with empty array");
  }
  return cards.reduce((best, cur) =>
    getCardValue(cur.rank) > getCardValue(best.rank) ? cur : best
  );
}

export function lowestCard(cards: Card[]): Card {
  if (cards.length === 0) {
    throw new Error("lowestCard called with empty array");
  }
  return cards.reduce((worst, cur) =>
    getCardValue(cur.rank) < getCardValue(worst.rank) ? cur : worst
  );
}

export function buildFullDeck(): Card[] {
  const suits: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
  const ranks: Rank[] = ["3", "4", "5", "6", "7", "8", "9"];
  const deck: Card[] = [];

  for (const suit of suits) {
    for (const rank of ranks) {
      if (suit === "spades" && rank === "9") {
        continue;
      }
      deck.push({
        id: `${suit}-${rank}-full-deck`,
        suit,
        rank,
        playable: false,
      });
    }
  }

  return deck;
}

