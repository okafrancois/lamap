"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getKoraGameEngine,
  createKoraGameEngine,
  buildInitialGameStateFromConfig,
  type Game,
  type PlayerEntity,
  type AIDifficulty,
  type GameConfig,
} from "@/engine/kora-game-engine";
import { type Card } from "common/deck";

export function useKoraEngine() {
  const [gameState, setGame] = useState<Game | null>(null);

  useEffect(() => {
    try {
      const engine = getKoraGameEngine();
      setGame(engine.getState());

      const unsubscribe = engine.subscribe((newState) => {
        setGame(newState);
      });

      return unsubscribe;
    } catch {
      // Le moteur n'est pas encore initialisé
      console.error("Game engine not initialized yet");
    }
  }, []);

  // Initialiser le moteur de jeu
  const initializeEngine = useCallback((gameData: Game) => {
    const engine = createKoraGameEngine(gameData);
    setGame(engine.getState());

    const unsubscribe = engine.subscribe((newState) => {
      setGame(newState);
    });

    return unsubscribe;
  }, []);

  // Actions principales
  const startGame = useCallback(() => {
    try {
      const engine = getKoraGameEngine();
      engine.startGame();
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

  const createNewVsAiGame = useCallback((gameConfig: GameConfig): Game => {
    try {
      const engine = getKoraGameEngine();
      engine.createNewGame(gameConfig);
      engine.startGame();
      const state = engine.getState();
      setGame(state);
      return state;
    } catch {
      const initialState = buildInitialGameStateFromConfig(gameConfig);
      const engine = createKoraGameEngine(initialState);
      engine.createNewGame(gameConfig);
      engine.startGame();
      const state = engine.getState();
      setGame(state);
      return state;
    }
  }, []);

  const createNewGame = useCallback((gameConfig: GameConfig): Game => {
    try {
      const engine = getKoraGameEngine();
      engine.createNewGame(gameConfig);
      const state = engine.getState();
      setGame(state);
      return state;
    } catch {
      const initialState = buildInitialGameStateFromConfig(gameConfig);
      const engine = createKoraGameEngine(initialState);
      engine.createNewGame(gameConfig);
      const state = engine.getState();
      setGame(state);
      return state;
    }
  }, []);

  return {
    // État du jeu
    gameState,

    // Actions d'initialisation
    initializeEngine,
    createNewGame,
    createNewVsAiGame,
    // Actions de jeu
    startGame,
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
    setOnGameUpdateCallback: (callback: (gameState: Game) => void) => {
      try {
        const engine = getKoraGameEngine();
        engine.setOnGameUpdateCallback(callback);
      } catch (error) {
        console.error(
          "Cannot set game update callback: engine not initialized",
          error,
        );
      }
    },

    // Réinitialiser l'état (pour retour à la sélection)
    resetEngine: () => {
      setGame(null);
    },

    // Mettre à jour l'état de la partie
    updateState: (updatedGameData: Game) => {
      try {
        const engine = getKoraGameEngine();
        engine.updateState(updatedGameData);
        setGame(updatedGameData);
      } catch (error) {
        console.error("Cannot update state: engine not initialized", error);
      }
    },

    joinOnlineGame: (player: PlayerEntity) => {
      try {
        const engine = getKoraGameEngine();
        const success = engine.joinOnlineGame(player);
        setGame(engine.getState());
        return success;
      } catch (error) {
        console.error("Cannot join online game: engine not initialized", error);
        return false;
      }
    },

    startOnlineGame: () => {
      try {
        const engine = getKoraGameEngine();
        const success = engine.startOnlineGame();
        setGame(engine.getState());
        return success;
      } catch (error) {
        console.error(
          "Cannot start online game: engine not initialized",
          error,
        );
        return false;
      }
    },
  };
}

// Export des types pour compatibilité
export type {
  Game,
  PlayerEntity,
  AIDifficulty,
} from "@/engine/kora-game-engine";
