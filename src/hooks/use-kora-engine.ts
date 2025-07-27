"use client";

import { useState, useEffect, useCallback } from "react";
import {
  gameEngine,
  type GameState,
  type Player,
  type GameMode,
  type AIDifficulty,
} from "@/engine/kora-game-engine";
import { type Card } from "common/deck";

// Conversion entre les anciens types et les nouveaux types du game engine
export function useKoraEngine() {
  const [gameState, setGameState] = useState<GameState>(gameEngine.getState());

  useEffect(() => {
    const unsubscribe = gameEngine.subscribe((newState) => {
      setGameState(newState);
    });

    return unsubscribe;
  }, []);

  // Actions principales
  const startNewGame = useCallback(() => {
    gameEngine.startNewGame();
  }, []);

  const playCard = useCallback((cardId: string, player: Player = "player") => {
    return gameEngine.playCard(cardId, player);
  }, []);

  // Actions de debug/god mode
  const toggleGodMode = useCallback(() => {
    gameEngine.toggleGodMode();
  }, []);

  const forcePlayerHand = useCallback((player: Player) => {
    gameEngine.forcePlayerHand(player);
  }, []);

  // Utilitaires
  const getPlayableCards = useCallback((player: Player) => {
    return gameEngine.getPlayableCards(player);
  }, []);

  const canPlayCard = useCallback(
    (cardId: string, player: Player = "player") => {
      return gameEngine.canPlayCard(cardId, player);
    },
    [],
  );

  const getGameSummary = useCallback(() => {
    return gameEngine.getGameSummary();
  }, []);

  // Convertir les cartes pour l'ancienne interface (compatibilité)
  const convertCardsForOldInterface = (cards: Card[]) => {
    return cards.map((card, index) => ({
      ...card,
      // Ajouter un index pour compatibilité avec l'ancienne interface
      index,
    }));
  };

  // Interface compatible avec l'ancien système
  const legacyInterface = {
    // États pour l'ancienne interface
    phase:
      gameState.status === "playing"
        ? ("playing" as const)
        : gameState.status === "victory"
          ? ("victory" as const)
          : gameState.status === "defeat"
            ? ("defeat" as const)
            : ("waiting" as const),

    currentTurn: (() => {
      // Déterminer qui doit jouer maintenant basé sur la logique du game engine
      const currentRoundCards = gameState.playedCards.filter(
        (p) => p.round === gameState.currentRound,
      );

      if (currentRoundCards.length === 0) {
        // Aucune carte jouée ce tour : c'est à celui qui a la main
        return gameState.playerWithHand === "player"
          ? ("player" as const)
          : ("opponent" as const);
      } else if (currentRoundCards.length === 1) {
        // Une carte jouée : c'est à l'autre joueur
        const firstPlayer = currentRoundCards[0]!.player;
        return firstPlayer !== "player"
          ? ("player" as const)
          : ("opponent" as const);
      } else {
        // Deux cartes jouées : tour terminé, en attente de résolution
        return gameState.playerWithHand === "player"
          ? ("player" as const)
          : ("opponent" as const);
      }
    })(),

    playerCards: convertCardsForOldInterface(gameState.playerCards),
    opponentCards: convertCardsForOldInterface(gameState.opponentCards),
    playedCards: gameState.playedCards, // Garder les PlayedCard[] avec l'info du joueur

    playableCards: gameState.playerCards
      .map((card, index) => (card.jouable ? index : -1))
      .filter((index) => index !== -1),

    hoveredCard: null, // Pas utilisé dans le game engine
    selectedCard: null, // Sera géré par l'interface
    isAnimating: false, // Pas utilisé dans le game engine

    // Informations supplémentaires du game engine
    currentRound: gameState.currentRound,
    playerKoras: gameState.playerKoras,
    opponentKoras: gameState.opponentKoras,
    playerWithHand: gameState.playerWithHand,
    currentBet: gameState.currentBet,
    godMode: gameState.godMode,
    gameLog: gameState.gameLog,

    // Actions pour l'ancienne interface
    startGame: startNewGame,
    endGame: () => {
      /* Géré automatiquement par l'engine */
    },
    setVictory: () => {
      /* Géré automatiquement par l'engine */
    },
    setDefeat: () => {
      /* Géré automatiquement par l'engine */
    },

    // Nouvelles actions du game engine
    playCard,
    toggleGodMode,
    forcePlayerHand,
    getPlayableCards,
    canPlayCard,
    getGameSummary,

    // Gestion IA
    gameMode: gameState.gameMode,
    aiDifficulty: gameState.aiDifficulty,
    isAIThinking: gameState.isAIThinking,
    setGameMode: useCallback((mode: "ai" | "online" | "local") => {
      gameEngine.setGameMode(mode);
    }, []),
    setAIDifficulty: useCallback((difficulty: "easy" | "medium" | "hard") => {
      gameEngine.setAIDifficulty(difficulty);
    }, []),
    triggerAITurn: useCallback(async () => {
      await gameEngine.triggerAITurn();
    }, []),
  };

  return legacyInterface;
}

// Export des types pour compatibilité
export type {
  GameState,
  Player,
  GameMode,
  AIDifficulty,
} from "@/engine/kora-game-engine";
