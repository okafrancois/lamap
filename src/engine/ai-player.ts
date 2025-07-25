import { type Card, type Suit, type Rank } from "common/deck";
import {
  type Player,
  type GameState,
  type PlayedCard,
} from "./kora-game-engine";

interface CardMemory {
  playedCards: Card[];
  playerPatterns: {
    preferredSuits: Suit[];
    averagePlayValue: number;
    aggressiveness: number;
  };
}

interface ProbabilityCard {
  card: Card;
  probability: number;
  value: number;
}

export class AIPlayer {
  private difficulty: "easy" | "medium" | "hard";
  private memory: CardMemory;

  constructor(difficulty: "easy" | "medium" | "hard" = "medium") {
    this.difficulty = difficulty;
    this.memory = {
      playedCards: [],
      playerPatterns: {
        preferredSuits: [],
        averagePlayValue: 7,
        aggressiveness: 0.5,
      },
    };
  }

  public chooseCard(gameState: GameState): Card | null {
    const opponentCards = gameState.opponentCards;
    const playableCards = opponentCards.filter((card) => card.jouable);

    if (playableCards.length === 0) {
      return null;
    }

    this.updateMemory(gameState);

    switch (this.difficulty) {
      case "easy":
        return this.chooseRandomCard(playableCards);
      case "medium":
        return this.chooseSmartCard(gameState, playableCards);
      case "hard":
        return this.chooseStrategicCard(gameState, playableCards);
      default:
        return this.chooseRandomCard(playableCards);
    }
  }

  private updateMemory(gameState: GameState): void {
    const playerPlayedCards = gameState.playedCards
      .filter((pc) => pc.player === "player")
      .map((pc) => pc.card);

    this.memory.playedCards = playerPlayedCards;

    if (playerPlayedCards.length > 0) {
      this.analyzePlayerPatterns(playerPlayedCards);
    }
  }

  private analyzePlayerPatterns(playerCards: Card[]): void {
    const suitCounts: Record<Suit, number> = {
      hearts: 0,
      diamonds: 0,
      clubs: 0,
      spades: 0,
    };

    let totalValue = 0;
    let aggressivePlays = 0;

    playerCards.forEach((card) => {
      suitCounts[card.suit]++;
      const value = this.getCardValue(card.rank);
      totalValue += value;

      if (value >= 11) aggressivePlays++;
    });

    this.memory.playerPatterns.preferredSuits = (
      Object.keys(suitCounts) as Suit[]
    ).sort((a, b) => suitCounts[b] - suitCounts[a]);

    this.memory.playerPatterns.averagePlayValue =
      playerCards.length > 0 ? totalValue / playerCards.length : 7;

    this.memory.playerPatterns.aggressiveness =
      playerCards.length > 0 ? aggressivePlays / playerCards.length : 0.5;
  }

  private chooseRandomCard(playableCards: Card[]): Card {
    const randomIndex = Math.floor(Math.random() * playableCards.length);
    return playableCards[randomIndex]!;
  }

  private chooseSmartCard(gameState: GameState, playableCards: Card[]): Card {
    if (gameState.currentRound === 5) {
      return (
        this.chooseKoraStrategy(gameState, playableCards) ??
        this.chooseBestCard(gameState, playableCards)
      );
    }

    if (gameState.playerWithHand === "opponent") {
      return this.chooseWhenHavingHand(gameState, playableCards);
    } else {
      return this.chooseWhenResponding(gameState, playableCards);
    }
  }

  private chooseStrategicCard(
    gameState: GameState,
    playableCards: Card[],
  ): Card {
    const koraCard = this.chooseKoraStrategy(gameState, playableCards);
    if (koraCard) return koraCard;

    const predictedCard = this.predictPlayerNextCard(gameState);
    const defensiveCard = this.chooseDefensiveCard(
      gameState,
      playableCards,
      predictedCard,
    );
    if (defensiveCard) return defensiveCard;

    const controlCard = this.chooseControlCard(gameState, playableCards);
    if (controlCard) return controlCard;

    return this.chooseOptimalCard(gameState, playableCards);
  }

  private chooseKoraStrategy(
    gameState: GameState,
    playableCards: Card[],
  ): Card | null {
    const threes = playableCards.filter((card) => card.rank === "3");

    if (gameState.currentRound === 5 && threes.length > 0) {
      if (gameState.playerWithHand === "opponent") {
        const safestThree = this.chooseSafestThree(gameState, threes);
        console.log("🎯 AI: Tentative de KORA au tour final !");
        return safestThree;
      } else {
        const currentRoundCards = gameState.playedCards.filter(
          (p) => p.round === gameState.currentRound,
        );

        if (currentRoundCards.length === 1) {
          const playerCard = currentRoundCards[0]!.card;
          const winningThree = threes.find(
            (three) =>
              three.suit === playerCard.suit &&
              this.getCardValue("3") > this.getCardValue(playerCard.rank),
          );

          if (winningThree) {
            console.log("🎯 AI: KORA en réponse avec un 3 gagnant !");
            return winningThree;
          }
        }
      }
    }

    if (gameState.currentRound >= 3 && threes.length > 0) {
      const protectedThree = this.findProtectedThree(gameState, threes);
      if (protectedThree) {
        console.log("🎯 AI: Préparation Kora - garde un 3 pour plus tard");
        return null;
      }
    }

    return null;
  }

  private chooseSafestThree(gameState: GameState, threes: Card[]): Card {
    if (threes.length === 1) return threes[0]!;

    const playerRemainingCards = this.estimatePlayerCards(gameState);

    return threes.reduce((safest, three) => {
      const threatsToThis = playerRemainingCards.filter(
        (pc) => pc.card.suit === three.suit && pc.value > 3,
      ).length;

      const threatsToSafest = playerRemainingCards.filter(
        (pc) => pc.card.suit === safest.suit && pc.value > 3,
      ).length;

      return threatsToThis < threatsToSafest ? three : safest;
    });
  }

  private findProtectedThree(
    gameState: GameState,
    threes: Card[],
  ): Card | null {
    const playerRemainingCards = this.estimatePlayerCards(gameState);

    return (
      threes.find((three) => {
        const threats = playerRemainingCards.filter(
          (pc) => pc.card.suit === three.suit && pc.value > 3,
        );
        return threats.length === 0;
      }) ?? null
    );
  }

  private predictPlayerNextCard(gameState: GameState): Card | null {
    const estimatedCards = this.estimatePlayerCards(gameState);

    if (estimatedCards.length === 0) return null;

    const patterns = this.memory.playerPatterns;

    let bestCandidate = estimatedCards[0]!.card;
    let bestScore = 0;

    estimatedCards.forEach(({ card, probability }) => {
      let score = probability;

      if (patterns.preferredSuits.includes(card.suit)) {
        score += 0.3;
      }

      const cardValue = this.getCardValue(card.rank);
      const valueDiff = Math.abs(cardValue - patterns.averagePlayValue);
      score += Math.max(0, 0.2 - valueDiff * 0.05);

      if (patterns.aggressiveness > 0.6 && cardValue >= 11) {
        score += 0.25;
      } else if (patterns.aggressiveness < 0.4 && cardValue <= 7) {
        score += 0.25;
      }

      if (score > bestScore) {
        bestScore = score;
        bestCandidate = card;
      }
    });

    console.log(
      `🔮 AI prédit: ${bestCandidate.rank}${this.getSuitSymbol(bestCandidate.suit)} (confiance: ${Math.round(bestScore * 100)}%)`,
    );
    return bestCandidate;
  }

  private chooseDefensiveCard(
    gameState: GameState,
    playableCards: Card[],
    predictedCard: Card | null,
  ): Card | null {
    if (!predictedCard || gameState.playerWithHand !== "opponent") {
      return null;
    }

    const sameSuitCards = playableCards.filter(
      (card) => card.suit === predictedCard.suit,
    );

    if (sameSuitCards.length > 0) {
      const justBetterCards = sameSuitCards.filter(
        (card) =>
          this.getCardValue(card.rank) >
            this.getCardValue(predictedCard.rank) &&
          this.getCardValue(card.rank) <=
            this.getCardValue(predictedCard.rank) + 3,
      );

      if (justBetterCards.length > 0) {
        console.log("🛡️ AI: Stratégie défensive - carte juste supérieure");
        return justBetterCards.reduce((min, card) =>
          this.getCardValue(card.rank) < this.getCardValue(min.rank)
            ? card
            : min,
        );
      }
    }

    return null;
  }

  private chooseControlCard(
    gameState: GameState,
    playableCards: Card[],
  ): Card | null {
    if (gameState.playerWithHand !== "opponent") return null;

    const playerEstimatedCards = this.estimatePlayerCards(gameState);
    const weakSuits = this.findPlayerWeakSuits(playerEstimatedCards);

    if (weakSuits.length > 0) {
      const controlCards = playableCards.filter((card) =>
        weakSuits.includes(card.suit),
      );

      if (controlCards.length > 0) {
        console.log("🎯 AI: Force le joueur sur une famille faible");
        return controlCards.reduce((best, card) =>
          this.getCardValue(card.rank) > this.getCardValue(best.rank)
            ? card
            : best,
        );
      }
    }

    return null;
  }

  private findPlayerWeakSuits(estimatedCards: ProbabilityCard[]): Suit[] {
    const suitStrength: Record<Suit, { count: number; maxValue: number }> = {
      hearts: { count: 0, maxValue: 0 },
      diamonds: { count: 0, maxValue: 0 },
      clubs: { count: 0, maxValue: 0 },
      spades: { count: 0, maxValue: 0 },
    };

    estimatedCards.forEach(({ card }) => {
      const suit = card.suit;
      const value = this.getCardValue(card.rank);
      suitStrength[suit].count++;
      suitStrength[suit].maxValue = Math.max(
        suitStrength[suit].maxValue,
        value,
      );
    });

    return (Object.keys(suitStrength) as Suit[]).filter(
      (suit) =>
        suitStrength[suit].count <= 1 || suitStrength[suit].maxValue <= 8,
    );
  }

  private estimatePlayerCards(gameState: GameState): ProbabilityCard[] {
    const allCards = this.createFullDeck();
    const playedCardIds = gameState.playedCards.map((pc) => pc.card.id);
    const opponentCardIds = gameState.opponentCards.map((c) => c.id);

    const availableCards = allCards.filter(
      (card) =>
        !playedCardIds.includes(card.id) && !opponentCardIds.includes(card.id),
    );

    const estimatedPlayerCardCount =
      5 - gameState.playedCards.filter((pc) => pc.player === "player").length;

    return availableCards.slice(0, estimatedPlayerCardCount).map((card) => ({
      card,
      probability: 1 / availableCards.length,
      value: this.getCardValue(card.rank),
    }));
  }

  private createFullDeck(): Card[] {
    const suits: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
    const ranks = [
      "A",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "J",
      "Q",
      "K",
    ];
    const deck: Card[] = [];

    suits.forEach((suit) => {
      ranks.forEach((rank) => {
        deck.push({
          suit,
          rank: rank as Rank,
          jouable: false,
          id: `${suit}-${rank}-estimated`,
        });
      });
    });

    return deck;
  }

  private chooseWhenHavingHand(
    gameState: GameState,
    playableCards: Card[],
  ): Card {
    const playerEstimatedCards = this.estimatePlayerCards(gameState);
    const weakSuits = this.findPlayerWeakSuits(playerEstimatedCards);

    if (weakSuits.length > 0) {
      const attackCards = playableCards.filter((card) =>
        weakSuits.includes(card.suit),
      );
      if (attackCards.length > 0) {
        return attackCards.reduce((best, card) =>
          this.getCardValue(card.rank) > this.getCardValue(best.rank)
            ? card
            : best,
        );
      }
    }

    const midValueCards = playableCards.filter((card) => {
      const value = this.getCardValue(card.rank);
      return value >= 6 && value <= 10;
    });

    if (midValueCards.length > 0) {
      return midValueCards[Math.floor(Math.random() * midValueCards.length)]!;
    }

    return this.chooseOptimalCard(gameState, playableCards);
  }

  private chooseWhenResponding(
    gameState: GameState,
    playableCards: Card[],
  ): Card {
    const currentRoundCards = gameState.playedCards.filter(
      (p) => p.round === gameState.currentRound,
    );

    if (currentRoundCards.length === 1) {
      const opponentCard = currentRoundCards[0]!.card;
      const sameSuitCards = playableCards.filter(
        (card) => card.suit === opponentCard.suit,
      );

      if (sameSuitCards.length > 0) {
        const winningCards = sameSuitCards.filter(
          (card) =>
            this.getCardValue(card.rank) > this.getCardValue(opponentCard.rank),
        );

        if (winningCards.length > 0) {
          return winningCards.reduce((min, card) =>
            this.getCardValue(card.rank) < this.getCardValue(min.rank)
              ? card
              : min,
          );
        }

        return sameSuitCards.reduce((min, card) =>
          this.getCardValue(card.rank) < this.getCardValue(min.rank)
            ? card
            : min,
        );
      }
    }

    return this.chooseBestCard(gameState, playableCards);
  }

  private chooseOptimalCard(gameState: GameState, playableCards: Card[]): Card {
    const currentRoundCards = gameState.playedCards.filter(
      (p) => p.round === gameState.currentRound,
    );

    if (currentRoundCards.length === 1) {
      const opponentCard = currentRoundCards[0]!.card;
      const sameSuitCards = playableCards.filter(
        (card) => card.suit === opponentCard.suit,
      );

      if (sameSuitCards.length > 0) {
        const winningCards = sameSuitCards.filter(
          (card) =>
            this.getCardValue(card.rank) > this.getCardValue(opponentCard.rank),
        );

        if (winningCards.length > 0) {
          return winningCards.reduce((min, card) =>
            this.getCardValue(card.rank) < this.getCardValue(min.rank)
              ? card
              : min,
          );
        }

        return sameSuitCards.reduce((min, card) =>
          this.getCardValue(card.rank) < this.getCardValue(min.rank)
            ? card
            : min,
        );
      }
    }

    return this.chooseBestCard(gameState, playableCards);
  }

  private chooseBestCard(gameState: GameState, playableCards: Card[]): Card {
    if (gameState.currentRound === 5) {
      return playableCards.reduce((best, card) =>
        this.getCardValue(card.rank) > this.getCardValue(best.rank)
          ? card
          : best,
      );
    }

    const goodCards = playableCards.filter((card) => {
      const value = this.getCardValue(card.rank);
      return value >= 6 && value <= 11;
    });

    if (goodCards.length > 0) {
      return goodCards[Math.floor(Math.random() * goodCards.length)]!;
    }

    return playableCards[Math.floor(Math.random() * playableCards.length)]!;
  }

  private getCardValue(rank: string): number {
    switch (rank) {
      case "A":
        return 14;
      case "K":
        return 13;
      case "Q":
        return 12;
      case "J":
        return 11;
      default:
        return parseInt(rank);
    }
  }

  private getSuitSymbol(suit: Suit): string {
    switch (suit) {
      case "hearts":
        return "♥";
      case "diamonds":
        return "♦";
      case "clubs":
        return "♣";
      case "spades":
        return "♠";
      default:
        return "";
    }
  }

  public getDifficulty(): string {
    return this.difficulty;
  }

  public setDifficulty(difficulty: "easy" | "medium" | "hard"): void {
    this.difficulty = difficulty;
    this.memory = {
      playedCards: [],
      playerPatterns: {
        preferredSuits: [],
        averagePlayValue: 7,
        aggressiveness: 0.5,
      },
    };
  }

  public getMemoryStats(): CardMemory {
    return { ...this.memory };
  }
}
