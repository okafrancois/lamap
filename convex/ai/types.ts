import { Card } from "../gameEngine";

export interface ProbabilityCard {
  card: Card;
  weight: number;
}

export enum BehaviourFlag {
  SavesThree = "SAVES_THREE",
  LeadsHigh = "LEADS_HIGH",
}

export interface EvalContext {
  round: number;
  isHandOwner: boolean;
  isRisky: boolean;
  predicted?: Card;
}

export type SimulatedPlayer = "ai" | "opponent";

export interface SimulatedGame {
  currentRound: number;
  maxRounds: number;
  status: "WAITING" | "PLAYING" | "ENDED";
  hasHandPlayerId: string | null;
  currentTurnPlayerId: string | null;
  players: {
    ai: {
      hand: Card[];
      playerId: string;
    };
    opponent: {
      hand: Card[];
      playerId: string;
    };
  };
  playedCards: {
    card: Card;
    playerId: string;
    round: number;
  }[];
  winnerId: string | null;
}
