import {
  calculateHandSum,
  checkAutomaticVictory,
  determineRoundWinner,
  Game,
  getPlayerId,
} from "../gameEngine";
import { Card } from "../validators";
import { SimulatedGame, SimulatedPlayer } from "./types";

export class GameAdapter {
  private game: SimulatedGame;

  constructor(game: Game, aiPlayerId: string, opponentPlayerId: string) {
    const aiPlayer = game.players.find((p) => getPlayerId(p) === aiPlayerId);
    const opponentPlayer = game.players.find(
      (p) => getPlayerId(p) === opponentPlayerId
    );

    this.game = {
      currentRound: game.currentRound,
      maxRounds: game.maxRounds,
      status: game.status,
      hasHandPlayerId: game.hasHandPlayerId,
      currentTurnPlayerId: game.currentTurnPlayerId,
      players: {
        ai: {
          hand: aiPlayer?.hand ? [...aiPlayer.hand] : [],
          playerId: aiPlayerId,
        },
        opponent: {
          hand: opponentPlayer?.hand ? [...opponentPlayer.hand] : [],
          playerId: opponentPlayerId,
        },
      },
      playedCards: game.playedCards.map((pc) => ({
        card: { ...pc.card },
        playerId: pc.playerId,
        round: pc.round,
      })),
      winnerId: game.winnerId,
    };
  }

  getHand(player: SimulatedPlayer): Card[] {
    return player === "ai" ?
        [...this.game.players.ai.hand]
      : [...this.game.players.opponent.hand];
  }

  getOpponentHand(): Card[] {
    return this.getHand("opponent");
  }

  get currentPlayer(): SimulatedPlayer {
    const currentId = this.game.currentTurnPlayerId;
    if (!currentId) return "ai";
    return currentId === this.game.players.ai.playerId ? "ai" : "opponent";
  }

  applyMove(move: {
    player: SimulatedPlayer;
    card: Card;
    round: number;
  }): void {
    const playerId =
      move.player === "ai" ?
        this.game.players.ai.playerId
      : this.game.players.opponent.playerId;

    this.game.playedCards.push({
      card: { ...move.card },
      playerId,
      round: move.round,
    });

    const hand =
      move.player === "ai" ?
        this.game.players.ai.hand
      : this.game.players.opponent.hand;

    const cardIndex = hand.findIndex((c) => c.id === move.card.id);
    if (cardIndex >= 0) {
      hand.splice(cardIndex, 1);
    }

    const currentRoundCards = this.game.playedCards.filter(
      (pc) => pc.round === this.game.currentRound
    );

    if (currentRoundCards.length === 2) {
      const firstCard = currentRoundCards[0];
      const secondCard = currentRoundCards[1];

      if (firstCard && secondCard) {
        const winnerId = determineRoundWinner(
          firstCard as any,
          secondCard as any,
          this.game.hasHandPlayerId ?? ""
        );

        this.game.hasHandPlayerId = winnerId;

        if (this.game.currentRound < this.game.maxRounds) {
          this.game.currentRound += 1;
        }

        this.game.currentTurnPlayerId = winnerId;
      }
    } else {
      const otherPlayerId =
        move.player === "ai" ?
          this.game.players.opponent.playerId
        : this.game.players.ai.playerId;
      this.game.currentTurnPlayerId = otherPlayerId;
    }

    this.checkGameEnd();
  }

  private checkGameEnd(): void {
    if (this.game.currentRound > this.game.maxRounds) {
      const aiHand = this.game.players.ai.hand;
      const opponentHand = this.game.players.opponent.hand;

      const autoVictory = checkAutomaticVictory(aiHand, opponentHand);

      if (autoVictory.hasVictory) {
        if (autoVictory.playerIndex === 0) {
          this.game.winnerId = this.game.players.ai.playerId;
        } else if (autoVictory.playerIndex === 1) {
          this.game.winnerId = this.game.players.opponent.playerId;
        }
        this.game.status = "ENDED";
        return;
      }

      const aiSum = calculateHandSum(aiHand);
      const opponentSum = calculateHandSum(opponentHand);

      if (aiSum < opponentSum) {
        this.game.winnerId = this.game.players.ai.playerId;
      } else if (opponentSum < aiSum) {
        this.game.winnerId = this.game.players.opponent.playerId;
      } else {
        this.game.winnerId = null;
      }

      this.game.status = "ENDED";
    }
  }

  isFinished(): boolean {
    return (
      this.game.status === "ENDED" ||
      this.game.currentRound > this.game.maxRounds
    );
  }

  getWinner(): SimulatedPlayer | null {
    if (!this.game.winnerId) return null;
    return this.game.winnerId === this.game.players.ai.playerId ?
        "ai"
      : "opponent";
  }

  get currentRound(): number {
    return this.game.currentRound;
  }
}

export class MCTS {
  private simulations: number;
  private rng = Math.random;

  constructor(simulations = 500) {
    this.simulations = simulations;
  }

  public run(
    game: Game,
    candidates: Card[],
    aiPlayerId: string,
    opponentPlayerId: string
  ): Card {
    if (candidates.length === 0) {
      throw new Error("MCTS.run called with no candidate cards");
    }

    const results = new Map<string, { wins: number; total: number }>();

    for (const c of candidates) {
      results.set(c.id, { wins: 0, total: 0 });
    }

    for (const rootCard of candidates) {
      const entry = results.get(rootCard.id)!;
      for (let i = 0; i < this.simulations; i++) {
        const win = this.playout(game, rootCard, aiPlayerId, opponentPlayerId);
        entry.total++;
        if (win) entry.wins++;
      }
    }

    let bestCard = candidates[0];
    let bestRate = -1;

    for (const c of candidates) {
      const { wins, total } = results.get(c.id)!;
      const rate = wins / total;
      if (rate > bestRate || (rate === bestRate && this.rng() < 0.5)) {
        bestRate = rate;
        bestCard = c;
      }
    }

    return bestCard;
  }

  private playout(
    game: Game,
    rootCard: Card,
    aiPlayerId: string,
    opponentPlayerId: string
  ): boolean {
    const sim = new GameAdapter(game, aiPlayerId, opponentPlayerId);

    sim.applyMove({
      player: "ai",
      card: rootCard,
      round: sim.currentRound,
    });

    const oppPlayable = this.getLegalCards(sim, "opponent");
    if (oppPlayable.length) {
      const oppCard = oppPlayable[Math.floor(this.rng() * oppPlayable.length)];
      sim.applyMove({
        player: "opponent",
        card: oppCard,
        round: sim.currentRound,
      });
    }

    while (!sim.isFinished()) {
      const cur = sim.currentPlayer;
      const playable = this.getLegalCards(sim, cur);
      if (playable.length === 0) break;

      const chosen = playable[Math.floor(this.rng() * playable.length)];
      sim.applyMove({
        player: cur,
        card: chosen,
        round: sim.currentRound,
      });
    }

    return sim.getWinner() === "ai";
  }

  private getLegalCards(sim: GameAdapter, player: SimulatedPlayer): Card[] {
    const hand = sim.getHand(player);
    const round = sim.currentRound;
    const playedCards = this.getPlayedCards(sim);
    const playerId = this.getPlayerId(sim, player);

    const lead = playedCards.find(
      (p) => p.round === round && p.playerId !== playerId
    );

    if (!lead) return hand;

    const sameSuit = hand.filter((c) => c.suit === lead.card.suit);
    return sameSuit.length > 0 ? sameSuit : hand;
  }

  private getPlayedCards(
    sim: GameAdapter
  ): { card: Card; playerId: string; round: number }[] {
    return (sim as any).game.playedCards;
  }

  private getPlayerId(sim: GameAdapter, player: SimulatedPlayer): string {
    return (sim as any).game.players[player].playerId;
  }
}
