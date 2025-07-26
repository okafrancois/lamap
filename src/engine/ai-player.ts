import { type Card, type Suit } from "@/components/common/deck";
import { type Player, type GameState } from "./kora-game-engine";

export class AIPlayer {
  private difficulty: "easy" | "medium" | "hard";

  constructor(difficulty: "easy" | "medium" | "hard" = "medium") {
    this.difficulty = difficulty;
  }

  public chooseCard(gameState: GameState): Card | null {
    const opponentCards = gameState.opponentCards;
    const playableCards = opponentCards.filter((card) => card.jouable);

    if (playableCards.length === 0) {
      return null;
    }

    switch (this.difficulty) {
      case "easy":
        return this.chooseRandomCard(playableCards);
      case "medium":
        return this.chooseSmartCard(gameState, playableCards);
      case "hard":
        return this.chooseOptimalCard(gameState, playableCards);
      default:
        return this.chooseRandomCard(playableCards);
    }
  }

  private chooseRandomCard(playableCards: Card[]): Card {
    const randomIndex = Math.floor(Math.random() * playableCards.length);
    return playableCards[randomIndex]!;
  }

  private chooseSmartCard(gameState: GameState, playableCards: Card[]): Card {
    // Stratégie moyenne : prendre en compte le contexte

    // Si c'est le tour final (tour 5), jouer plus agressivement
    if (gameState.currentRound === 5) {
      return this.chooseBestCard(gameState, playableCards);
    }

    // Si on a la main, jouer une carte moyenne pour garder le contrôle
    if (gameState.playerWithHand === "opponent") {
      const midValueCards = playableCards.filter((card) => {
        const value = this.getCardValue(card.rank);
        return value >= 5 && value <= 9;
      });

      if (midValueCards.length > 0) {
        return midValueCards[Math.floor(Math.random() * midValueCards.length)]!;
      }
    }

    // Sinon, essayer de prendre la main avec une carte forte
    return this.chooseBestCard(gameState, playableCards);
  }

  private chooseOptimalCard(gameState: GameState, playableCards: Card[]): Card {
    // Stratégie difficile : analyse complète

    const currentRoundCards = gameState.playedCards.filter(
      (p) => p.round === gameState.currentRound,
    );

    // Si on répond à une carte
    if (currentRoundCards.length === 1) {
      const opponentCard = currentRoundCards[0]!.card;
      const sameSuitCards = playableCards.filter(
        (card) => card.suit === opponentCard.suit,
      );

      if (sameSuitCards.length > 0) {
        // Essayer de jouer une carte juste au-dessus
        const winningCards = sameSuitCards.filter(
          (card) =>
            this.getCardValue(card.rank) > this.getCardValue(opponentCard.rank),
        );

        if (winningCards.length > 0) {
          // Prendre la plus petite carte qui gagne
          return winningCards.reduce((min, card) =>
            this.getCardValue(card.rank) < this.getCardValue(min.rank)
              ? card
              : min,
          );
        }

        // Si on ne peut pas gagner, jouer la plus petite carte
        return sameSuitCards.reduce((min, card) =>
          this.getCardValue(card.rank) < this.getCardValue(min.rank)
            ? card
            : min,
        );
      }
    }

    // Si on a la main ou pas de contrainte, choisir stratégiquement
    return this.chooseBestCard(gameState, playableCards);
  }

  private chooseBestCard(gameState: GameState, playableCards: Card[]): Card {
    // Tour final : jouer la meilleure carte possible
    if (gameState.currentRound === 5) {
      return playableCards.reduce((best, card) =>
        this.getCardValue(card.rank) > this.getCardValue(best.rank)
          ? card
          : best,
      );
    }

    // Eviter de jouer les cartes trop fortes trop tôt
    const goodCards = playableCards.filter((card) => {
      const value = this.getCardValue(card.rank);
      return value >= 6 && value <= 11; // Éviter As (1) et figures trop fortes
    });

    if (goodCards.length > 0) {
      return goodCards[Math.floor(Math.random() * goodCards.length)]!;
    }

    // Si pas de choix, prendre une carte aléatoire
    return playableCards[Math.floor(Math.random() * playableCards.length)]!;
  }

  private getCardValue(rank: string): number {
    switch (rank) {
      case "A":
        return 1;
      case "J":
        return 11;
      case "Q":
        return 12;
      case "K":
        return 13;
      default:
        return parseInt(rank);
    }
  }

  public getDifficulty(): string {
    return this.difficulty;
  }

  public setDifficulty(difficulty: "easy" | "medium" | "hard"): void {
    this.difficulty = difficulty;
  }
}
