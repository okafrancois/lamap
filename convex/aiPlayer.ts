import { Card, Game, getCardValue, getPlayerId } from "./gameEngine";
import { Rank, Suit } from "./validators";

type AIDifficulty = "easy" | "medium" | "hard";

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
  private difficulty: AIDifficulty;
  private memory: CardMemory;

  constructor(difficulty: AIDifficulty = "medium") {
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

  public chooseCard(gameState: Game): Card | null {
    const aiPlayer = gameState.players.find((p) => p.type === "ai");
    if (!aiPlayer?.hand) {
      return null;
    }

    const playableCards = aiPlayer.hand.filter((card) => card.playable);

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

  private updateMemory(gameState: Game): void {
    const humanPlayer = gameState.players.find((p) => p.type === "user");
    if (!humanPlayer) return;

    const playerPlayedCards = gameState.playedCards
      .filter((pc) => pc.playerId === getPlayerId(humanPlayer))
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
      suitCounts[card.suit as Suit]++;
      const value = getCardValue(card.rank);
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
    return playableCards[randomIndex];
  }

  private chooseSmartCard(gameState: Game, playableCards: Card[]): Card {
    if (gameState.currentRound === 5) {
      return (
        this.chooseKoraStrategy(gameState, playableCards) ??
        this.chooseBestCard(gameState, playableCards)
      );
    }

    const aiPlayer = gameState.players.find((p) => p.type === "ai");
    if (!aiPlayer) return this.chooseBestCard(gameState, playableCards);

    const hasHand = gameState.hasHandPlayerId === getPlayerId(aiPlayer);

    if (hasHand) {
      return this.chooseWhenHavingHand(gameState, playableCards);
    } else {
      return this.chooseWhenResponding(gameState, playableCards);
    }
  }

  private chooseStrategicCard(gameState: Game, playableCards: Card[]): Card {
    const koraCard = this.chooseKoraStrategy(gameState, playableCards);
    if (koraCard) return koraCard;

    const predictedCard = this.predictPlayerNextCard(gameState);
    const defensiveCard = this.chooseDefensiveCard(
      gameState,
      playableCards,
      predictedCard
    );
    if (defensiveCard) return defensiveCard;

    const controlCard = this.chooseControlCard(gameState, playableCards);
    if (controlCard) return controlCard;

    return this.chooseOptimalCard(gameState, playableCards);
  }

  private chooseKoraStrategy(
    gameState: Game,
    playableCards: Card[]
  ): Card | null {
    const threes = playableCards.filter((card) => card.rank === "3");

    if (gameState.currentRound === 5 && threes.length > 0) {
      const aiPlayer = gameState.players.find((p) => p.type === "ai");
      if (!aiPlayer) return null;

      const hasHand = gameState.hasHandPlayerId === getPlayerId(aiPlayer);

      if (hasHand) {
        const safestThree = this.chooseSafestThree(gameState, threes);
        return safestThree;
      } else {
        const currentRoundCards = gameState.playedCards.filter(
          (p) => p.round === gameState.currentRound
        );

        if (currentRoundCards.length === 1) {
          const playerCard = currentRoundCards[0].card;
          const winningThree = threes.find(
            (three) =>
              three.suit === playerCard.suit &&
              getCardValue("3") > getCardValue(playerCard.rank)
          );

          if (winningThree) {
            return winningThree;
          }
        }
      }
    }

    if (gameState.currentRound >= 3 && threes.length > 0) {
      const protectedThree = this.findProtectedThree(gameState, threes);
      if (protectedThree) {
        return null;
      }
    }

    return null;
  }

  private chooseSafestThree(gameState: Game, threes: Card[]): Card {
    if (threes.length === 1) return threes[0];

    const playerRemainingCards = this.estimatePlayerCards(gameState);

    return threes.reduce((safest, three) => {
      const threatsToThis = playerRemainingCards.filter(
        (pc) => pc.card.suit === three.suit && pc.value > 3
      ).length;

      const threatsToSafest = playerRemainingCards.filter(
        (pc) => pc.card.suit === safest.suit && pc.value > 3
      ).length;

      return threatsToThis < threatsToSafest ? three : safest;
    });
  }

  private findProtectedThree(gameState: Game, threes: Card[]): Card | null {
    const playerRemainingCards = this.estimatePlayerCards(gameState);

    return (
      threes.find((three) => {
        const threats = playerRemainingCards.filter(
          (pc) => pc.card.suit === three.suit && pc.value > 3
        );
        return threats.length === 0;
      }) ?? null
    );
  }

  private predictPlayerNextCard(gameState: Game): Card | null {
    const estimatedCards = this.estimatePlayerCards(gameState);

    if (estimatedCards.length === 0) return null;

    const patterns = this.memory.playerPatterns;

    let bestCandidate = estimatedCards[0].card;
    let bestScore = 0;

    estimatedCards.forEach(({ card, probability }) => {
      let score = probability;

      if (patterns.preferredSuits.includes(card.suit)) {
        score += 0.3;
      }

      const cardValue = getCardValue(card.rank);
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

    return bestCandidate;
  }

  private chooseDefensiveCard(
    gameState: Game,
    playableCards: Card[],
    predictedCard: Card | null
  ): Card | null {
    const aiPlayer = gameState.players.find((p) => p.type === "ai");
    if (
      !aiPlayer ||
      !predictedCard ||
      gameState.hasHandPlayerId === getPlayerId(aiPlayer)
    ) {
      return null;
    }

    const sameSuitCards = playableCards.filter(
      (card) => card.suit === predictedCard.suit
    );

    if (sameSuitCards.length > 0) {
      const justBetterCards = sameSuitCards.filter(
        (card) =>
          getCardValue(card.rank) > getCardValue(predictedCard.rank) &&
          getCardValue(card.rank) <= getCardValue(predictedCard.rank) + 3
      );

      if (justBetterCards.length > 0) {
        return justBetterCards.reduce((min, card) =>
          getCardValue(card.rank) < getCardValue(min.rank) ? card : min
        );
      }
    }

    return null;
  }

  private chooseControlCard(
    gameState: Game,
    playableCards: Card[]
  ): Card | null {
    const aiPlayer = gameState.players.find((p) => p.type === "ai");
    if (!aiPlayer || gameState.hasHandPlayerId !== getPlayerId(aiPlayer))
      return null;

    const playerEstimatedCards = this.estimatePlayerCards(gameState);
    const weakSuits = this.findPlayerWeakSuits(playerEstimatedCards);

    if (weakSuits.length > 0) {
      const controlCards = playableCards.filter((card) =>
        weakSuits.includes(card.suit)
      );

      if (controlCards.length > 0) {
        return controlCards.reduce((best, card) =>
          getCardValue(card.rank) > getCardValue(best.rank) ? card : best
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
      const value = getCardValue(card.rank);
      suitStrength[suit as Suit].count++;
      suitStrength[suit as Suit].maxValue = Math.max(
        suitStrength[suit as Suit].maxValue,
        value
      );
    });

    return (Object.keys(suitStrength) as Suit[]).filter(
      (suit) =>
        suitStrength[suit].count <= 1 || suitStrength[suit].maxValue <= 8
    );
  }

  private estimatePlayerCards(gameState: Game): ProbabilityCard[] {
    const allCards = this.createFullDeck();
    const playedCardIds = gameState.playedCards.map((pc) => pc.card.id);

    const aiPlayer = gameState.players.find((p) => p.type === "ai");
    const aiCardIds = aiPlayer?.hand?.map((c) => c.id) ?? [];

    const availableCards = allCards.filter(
      (card) => !playedCardIds.includes(card.id) && !aiCardIds.includes(card.id)
    );

    const humanPlayer = gameState.players.find((p) => p.type === "user");
    const humanPlayedCount =
      humanPlayer ?
        gameState.playedCards.filter(
          (pc) => pc.playerId === getPlayerId(humanPlayer)
        ).length
      : 0;
    const estimatedPlayerCardCount = 5 - humanPlayedCount;

    return availableCards.slice(0, estimatedPlayerCardCount).map((card) => ({
      card,
      probability: 1 / availableCards.length,
      value: getCardValue(card.rank),
    }));
  }

  private createFullDeck(): Card[] {
    const suits: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
    const ranks: Rank[] = ["3", "4", "5", "6", "7", "8", "9"];
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
          id: `${suit}-${rank}-estimated`,
        });
      });
    });

    return deck;
  }

  private chooseWhenHavingHand(gameState: Game, playableCards: Card[]): Card {
    const playerEstimatedCards = this.estimatePlayerCards(gameState);
    const weakSuits = this.findPlayerWeakSuits(playerEstimatedCards);

    if (weakSuits.length > 0) {
      const attackCards = playableCards.filter((card) =>
        weakSuits.includes(card.suit)
      );
      if (attackCards.length > 0) {
        return attackCards.reduce((best, card) =>
          getCardValue(card.rank) > getCardValue(best.rank) ? card : best
        );
      }
    }

    const midValueCards = playableCards.filter((card) => {
      const value = getCardValue(card.rank);
      return value >= 6 && value <= 10;
    });

    if (midValueCards.length > 0) {
      return midValueCards[Math.floor(Math.random() * midValueCards.length)];
    }

    return this.chooseOptimalCard(gameState, playableCards);
  }

  private chooseWhenResponding(gameState: Game, playableCards: Card[]): Card {
    const currentRoundCards = gameState.playedCards.filter(
      (p) => p.round === gameState.currentRound
    );

    if (currentRoundCards.length === 1) {
      const opponentCard = currentRoundCards[0].card;
      const sameSuitCards = playableCards.filter(
        (card) => card.suit === opponentCard.suit
      );

      if (sameSuitCards.length > 0) {
        const winningCards = sameSuitCards.filter(
          (card) => getCardValue(card.rank) > getCardValue(opponentCard.rank)
        );

        if (winningCards.length > 0) {
          return winningCards.reduce((min, card) =>
            getCardValue(card.rank) < getCardValue(min.rank) ? card : min
          );
        }

        return sameSuitCards.reduce((min, card) =>
          getCardValue(card.rank) < getCardValue(min.rank) ? card : min
        );
      }
    }

    return this.chooseBestCard(gameState, playableCards);
  }

  private chooseOptimalCard(gameState: Game, playableCards: Card[]): Card {
    const currentRoundCards = gameState.playedCards.filter(
      (p) => p.round === gameState.currentRound
    );

    if (currentRoundCards.length === 1) {
      const opponentCard = currentRoundCards[0].card;
      const sameSuitCards = playableCards.filter(
        (card) => card.suit === opponentCard.suit
      );

      if (sameSuitCards.length > 0) {
        const winningCards = sameSuitCards.filter(
          (card) => getCardValue(card.rank) > getCardValue(opponentCard.rank)
        );

        if (winningCards.length > 0) {
          return winningCards.reduce((min, card) =>
            getCardValue(card.rank) < getCardValue(min.rank) ? card : min
          );
        }

        return sameSuitCards.reduce((min, card) =>
          getCardValue(card.rank) < getCardValue(min.rank) ? card : min
        );
      }
    }

    return this.chooseBestCard(gameState, playableCards);
  }

  private chooseBestCard(gameState: Game, playableCards: Card[]): Card {
    if (gameState.currentRound === 5) {
      return playableCards.reduce((best, card) =>
        getCardValue(card.rank) > getCardValue(best.rank) ? card : best
      );
    }

    const goodCards = playableCards.filter((card) => {
      const value = getCardValue(card.rank);
      return value >= 6 && value <= 11;
    });

    if (goodCards.length > 0) {
      return goodCards[Math.floor(Math.random() * goodCards.length)];
    }

    return playableCards[Math.floor(Math.random() * playableCards.length)];
  }
}

export function chooseAICard(
  gameState: Game,
  difficulty: "easy" | "medium" | "hard"
): Card | null {
  const ai = new AIPlayer(difficulty);
  return ai.chooseCard(gameState);
}
