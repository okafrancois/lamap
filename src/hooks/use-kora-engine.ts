"use client";

import { useState, useEffect, useCallback } from "react";
import {
  gameEngine,
  type GameState,
  type Player,
} from "@/engine/kora-game-engine";
import { type Card } from "@/components/common/deck";

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

    currentTurn:
      gameState.playerWithHand === "player"
        ? ("player" as const)
        : ("opponent" as const),

    playerCards: convertCardsForOldInterface(gameState.playerCards),
    opponentCards: convertCardsForOldInterface(gameState.opponentCards),
    playedCards: gameState.playedCards.map((p) => p.card),

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
  };

  return legacyInterface;
}

// Export des types pour compatibilité
export type { GameState, Player } from "@/engine/kora-game-engine";
