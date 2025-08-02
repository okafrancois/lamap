"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getKoraGameEngine,
  createKoraGameEngine,
  type GameState,
  type PlayerEntity,
  type AIDifficulty,
} from "@/engine/kora-game-engine";
import { type Card } from "common/deck";

export function useKoraEngine() {
  const [gameState, setGameState] = useState<GameState | null>(null);

  useEffect(() => {
    try {
      const engine = getKoraGameEngine();
      setGameState(engine.getState());

      const unsubscribe = engine.subscribe((newState) => {
        setGameState(newState);
      });

      return unsubscribe;
    } catch {
      // Le moteur n'est pas encore initialisé
      console.log("Game engine not initialized yet");
    }
  }, []);

  // Initialiser le moteur de jeu
  const initializeEngine = useCallback(
    (bet: number, maxRounds: number, players: PlayerEntity[]) => {
      const engine = createKoraGameEngine(bet, maxRounds, players);
      setGameState(engine.getState());

      const unsubscribe = engine.subscribe((newState) => {
        setGameState(newState);
      });

      return unsubscribe;
    },
    [],
  );

  // Actions principales
  const startNewGame = useCallback(() => {
    try {
      const engine = getKoraGameEngine();
      engine.startNewGame();
    } catch (error) {
      console.error("Cannot start game: engine not initialized", error);
    }
  }, []);

  const playCard = useCallback(
    (cardId: string, playerId: string) => {
      try {
        const engine = getKoraGameEngine();
        const player = gameState?.players.find((p) => p.username === playerId);
        if (player) {
          return engine.playCard(cardId, player);
        }
        return false;
      } catch (error) {
        console.error("Cannot play card: engine not initialized", error);
        return false;
      }
    },
    [gameState],
  );

  // Utilitaires
  const getPlayableCards = useCallback(
    (playerId: string): Card[] => {
      try {
        const engine = getKoraGameEngine();
        const player = gameState?.players.find((p) => p.username === playerId);
        if (player) {
          return engine.getPlayableCards(player);
        }
        return [];
      } catch (error) {
        console.error(
          "Cannot get playable cards: engine not initialized",
          error,
        );
        return [];
      }
    },
    [gameState],
  );

  const canPlayCard = useCallback(
    (cardId: string, playerId: string): boolean => {
      try {
        const engine = getKoraGameEngine();
        const player = gameState?.players.find((p) => p.username === playerId);
        if (player) {
          return engine.canPlayCard(cardId, player);
        }
        return false;
      } catch (error) {
        console.error(
          "Cannot check playable card: engine not initialized",
          error,
        );
        return false;
      }
    },
    [gameState],
  );

  const getGameSummary = useCallback((): string => {
    try {
      const engine = getKoraGameEngine();
      return engine.getGameSummary();
    } catch (error) {
      console.error("Cannot get game summary: engine not initialized", error);
      return "";
    }
  }, []);

  // Gestion IA
  const setAIDifficulty = useCallback((difficulty: AIDifficulty) => {
    try {
      const engine = getKoraGameEngine();
      engine.setAIDifficulty(difficulty);
    } catch (error) {
      console.error("Cannot set AI difficulty: engine not initialized", error);
    }
  }, []);

  const triggerAITurn = useCallback(async () => {
    try {
      const engine = getKoraGameEngine();
      const aiPlayer = gameState?.players.find((p) => p.type === "ai");
      if (aiPlayer) {
        await engine.triggerAITurn(aiPlayer);
      }
    } catch (error) {
      console.error("Cannot trigger AI turn: engine not initialized", error);
    }
  }, [gameState]);

  // Analyses de victoire
  const getVictoryType = useCallback((playerUsername?: string) => {
    try {
      const engine = getKoraGameEngine();
      return engine.getVictoryType(playerUsername);
    } catch (error) {
      console.error("Cannot get victory type: engine not initialized", error);
      return {
        type: "normal" as const,
        title: "Partie terminée",
        description: "Résultat non disponible",
        multiplier: "x1",
        special: false,
      };
    }
  }, []);

  const getKorasWonThisGame = useCallback((): number => {
    try {
      const engine = getKoraGameEngine();
      return engine.getKorasWonThisGame();
    } catch (error) {
      console.error("Cannot get koras won: engine not initialized", error);
      return 0;
    }
  }, []);

  const getVictoryMessage = useCallback((isPlayerWinner: boolean): string => {
    try {
      const engine = getKoraGameEngine();
      return engine.getVictoryMessage(isPlayerWinner);
    } catch (error) {
      console.error(
        "Cannot get victory message: engine not initialized",
        error,
      );
      return "";
    }
  }, []);

  return {
    // État du jeu
    gameState,

    // Actions d'initialisation
    initializeEngine,

    // Actions de jeu
    startNewGame,
    playCard,

    // Utilitaires
    getPlayableCards,
    canPlayCard,
    getGameSummary,

    // Gestion IA
    setAIDifficulty,
    triggerAITurn,

    // Analyses
    getVictoryType,
    getKorasWonThisGame,
    getVictoryMessage,

    // Callbacks
    setOnVictoryCallback: (callback: () => void) => {
      try {
        const engine = getKoraGameEngine();
        engine.setOnVictoryCallback(callback);
      } catch (error) {
        console.error(
          "Cannot set victory callback: engine not initialized",
          error,
        );
      }
    },
  };
}

// Export des types pour compatibilité
export type {
  GameState,
  PlayerEntity,
  AIDifficulty,
} from "@/engine/kora-game-engine";
