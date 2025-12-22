import { calculateHandSum, Game, getPlayerId } from "../gameEngine";
import { Card } from "../validators";
import { getCardValue, highestCard, isKora, lowestCard } from "./helpers";
import { MCTS } from "./mcts";
import { BehaviourFlag, EvalContext } from "./types";

type AIDifficulty = "easy" | "medium" | "hard";

interface AIMemory {
  remainingDeck: Card[];
  behaviourFlags: Set<BehaviourFlag>;
}

export class AIPlayer {
  private difficulty: AIDifficulty;
  private memory: AIMemory;

  constructor(difficulty: AIDifficulty = "medium") {
    this.difficulty = difficulty;
    this.memory = {
      remainingDeck: [],
      behaviourFlags: new Set<BehaviourFlag>(),
    };
  }

  public async chooseAICard(game: Game, playableCards: Card[]): Promise<Card> {
    this.updateMemory(game);

    const aiPlayer = game.players.find((p) => p.type === "ai");
    if (!aiPlayer?.hand) {
      return playableCards[0];
    }

    if (playableCards.length === 0) {
      return aiPlayer.hand[0];
    }

    if (this.difficulty === "easy") {
      return this.chooseRandomCard(playableCards);
    }

    if (this.isAutoWin(aiPlayer.hand)) {
      return highestCard(playableCards);
    }

    if (this.isHandLossLikely(game, playableCards)) {
      return lowestCard(playableCards);
    }

    if (this.difficulty === "hard" && game.currentRound >= 3) {
      const aiPlayerId = getPlayerId(aiPlayer);
      const opponentPlayer = game.players.find((p) => p.type === "user");
      if (opponentPlayer) {
        const opponentPlayerId = getPlayerId(opponentPlayer);
        const mcts = new MCTS(200);
        const mctsChoice = mcts.run(
          game,
          playableCards,
          aiPlayerId,
          opponentPlayerId
        );

        const ctx = this.buildEvalContext(game, playableCards);
        const mctsScore = this.evaluateCard(mctsChoice, ctx, game);
        const normalBest = this.pickCardByScore(game, playableCards);
        const normalScore = this.evaluateCard(normalBest, ctx, game);

        if (mctsScore > normalScore * 0.9) {
          return mctsChoice;
        }
      }
    }

    return this.pickCardByScore(game, playableCards);
  }

  private updateMemory(game: Game): void {
    this.refreshRemainingDeck(game);
    this.detectBehaviourFlags(game);
  }

  private refreshRemainingDeck(game: Game): void {
    const suits: Card["suit"][] = ["hearts", "diamonds", "clubs", "spades"];
    const ranks: Card["rank"][] = ["3", "4", "5", "6", "7", "8", "9"];
    const fullDeck: Card[] = [];

    for (const suit of suits) {
      for (const rank of ranks) {
        if (suit === "spades" && rank === "9") {
          continue;
        }
        fullDeck.push({
          id: `${suit}-${rank}-${game.seed}-${suits.indexOf(suit) * 8 + ranks.indexOf(rank)}`,
          suit,
          rank,
          playable: false,
        });
      }
    }

    const playedCardIds = new Set(game.playedCards.map((pc) => pc.card.id));

    const aiPlayer = game.players.find((p) => p.type === "ai");
    const aiCardIds = new Set(aiPlayer?.hand?.map((c) => c.id) ?? []);

    this.memory.remainingDeck = fullDeck.filter(
      (card) => !playedCardIds.has(card.id) && !aiCardIds.has(card.id)
    );
  }

  private detectBehaviourFlags(game: Game): void {
    const flags = this.memory.behaviourFlags;
    const opponentPlayer = game.players.find((p) => p.type === "user");
    if (!opponentPlayer) return;

    const opponentId = getPlayerId(opponentPlayer);
    const opponentPlays = game.playedCards.filter(
      (pc) => pc.playerId === opponentId
    );

    const highLead = opponentPlays.find(
      (pc) => getCardValue(pc.card.rank) >= 8 && pc.round === 1
    );
    if (highLead) {
      flags.add(BehaviourFlag.LeadsHigh);
    }

    const threeLead = opponentPlays.find((pc) => pc.card.rank === "3");
    if (threeLead && game.currentRound === 5) {
      flags.add(BehaviourFlag.SavesThree);
    }
  }

  private scoreCard(card: Card, round: number): number {
    const base = getCardValue(card.rank);

    if (isKora(card)) {
      const multiplier =
        round === 5 ? 3
        : round === 4 ? 2
        : round === 3 ? 1.5
        : 1;
      return base * multiplier;
    }

    return base;
  }

  private buildEvalContext(game: Game, playableCards: Card[]): EvalContext {
    return {
      round: game.currentRound,
      isHandOwner: this.isHandOwner(game),
      isRisky: this.isHandLossLikely(game, playableCards),
      predicted: this.predictOpponentCard(game, playableCards),
    };
  }

  private pickCardByScore(game: Game, playableCards: Card[]): Card {
    const ctx = this.buildEvalContext(game, playableCards);
    let bestCard = playableCards[0];
    let bestScore = -Infinity;

    for (const card of playableCards) {
      const score = this.evaluateCard(card, ctx, game);
      if (score > bestScore) {
        bestScore = score;
        bestCard = card;
      }
    }

    return bestCard;
  }

  private evaluateCard(card: Card, ctx: EvalContext, game?: Game): number {
    const round = ctx.round;
    const base = this.scoreCard(card, round);

    const leadCard = this.getLeadCard(game, ctx.round, ctx.predicted);
    const followsSuit = leadCard && leadCard.suit === card.suit;
    const followBonus = followsSuit ? 1.0 : 0.2;

    const predictionBonus =
      ctx.predicted && ctx.predicted.id === card.id ? 0.5 : 0.0;

    const handOwnerBonus = ctx.isHandOwner ? 0.3 : 0.0;

    let behaviourBonus = 0.0;
    if (
      this.memory.behaviourFlags.has(BehaviourFlag.SavesThree) &&
      isKora(card)
    ) {
      behaviourBonus = 0.4;
    }

    if (ctx.isRisky && !isKora(card)) {
      behaviourBonus -= 1.0;
    }

    const total =
      base *
        (1 + followBonus + predictionBonus + handOwnerBonus + behaviourBonus) +
      Math.random() * 0.01;

    return total;
  }

  private getLeadCard(
    game: Game | undefined,
    round: number,
    predicted?: Card
  ): Card | null {
    if (predicted) {
      return predicted;
    }
    if (!game) return null;

    const aiPlayer = game.players.find((p) => p.type === "ai");
    if (!aiPlayer) return null;

    const aiPlayerId = getPlayerId(aiPlayer);
    const lead = game.playedCards.find(
      (pc) => pc.round === round && pc.playerId !== aiPlayerId
    );

    return lead ? lead.card : null;
  }

  private isHandOwner(game: Game): boolean {
    const aiPlayer = game.players.find((p) => p.type === "ai");
    if (!aiPlayer) return false;

    const aiPlayerId = getPlayerId(aiPlayer);
    const round = game.currentRound;
    const lead = game.playedCards.find(
      (pc) => pc.round === round && pc.playerId !== aiPlayerId
    );

    if (!lead) return false;
    return game.hasHandPlayerId === aiPlayerId;
  }

  private isAutoWin(hand: Card[]): boolean {
    const total = calculateHandSum(hand);
    return total < 21;
  }

  private isHandLossLikely(game: Game, playableCards: Card[]): boolean {
    const round = game.currentRound;
    const aiPlayer = game.players.find((p) => p.type === "ai");
    if (!aiPlayer) return false;

    const aiPlayerId = getPlayerId(aiPlayer);
    const lead = game.playedCards.find(
      (pc) => pc.round === round && pc.playerId !== aiPlayerId
    );

    if (!lead) return false;

    const sameSuitInDeck = this.memory.remainingDeck.filter(
      (c) => c.suit === lead.card.suit
    );

    const aiHand = aiPlayer.hand ?? [];
    const sameSuitInHand = aiHand.filter((c) => c.suit === lead.card.suit);
    const legalCards = sameSuitInHand.length > 0 ? sameSuitInHand : aiHand;

    if (legalCards.length === 0) return false;

    const aiBest = highestCard(legalCards);
    const aiBestVal = getCardValue(aiBest.rank);

    const oppBestVal = sameSuitInDeck.reduce(
      (best, c) => Math.max(best, getCardValue(c.rank)),
      0
    );

    return oppBestVal > aiBestVal;
  }

  private predictOpponentCard(
    game: Game,
    playableCards: Card[]
  ): Card | undefined {
    const round = game.currentRound;
    const aiPlayer = game.players.find((p) => p.type === "ai");
    if (!aiPlayer) return undefined;

    const aiPlayerId = getPlayerId(aiPlayer);
    const lead = game.playedCards.find(
      (pc) => pc.round === round && pc.playerId !== aiPlayerId
    );

    if (!lead) return undefined;

    const possible = this.memory.remainingDeck.filter(
      (c) => c.suit === lead.card.suit
    );

    const pool = possible.length > 0 ? possible : this.memory.remainingDeck;

    if (pool.length === 0) return undefined;

    const weighted = pool.map((c) => ({
      card: c,
      weight: getCardValue(c.rank),
    }));

    const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
    if (totalWeight === 0) return weighted[0]?.card;

    const pick = Math.random() * totalWeight;
    let acc = 0;

    for (const w of weighted) {
      acc += w.weight;
      if (pick <= acc) return w.card;
    }

    return weighted[0]?.card;
  }

  private chooseRandomCard(playableCards: Card[]): Card {
    const randomIndex = Math.floor(Math.random() * playableCards.length);
    return playableCards[randomIndex];
  }
}

export async function chooseAICard(
  game: Game,
  difficulty: "easy" | "medium" | "hard"
): Promise<Card | null> {
  const aiPlayer = game.players.find((p) => p.type === "ai");
  if (!aiPlayer?.hand) {
    return null;
  }

  const playableCards = aiPlayer.hand.filter((card) => card.playable);
  if (playableCards.length === 0) {
    return null;
  }

  const ai = new AIPlayer(difficulty);
  return await ai.chooseAICard(game, playableCards);
}
