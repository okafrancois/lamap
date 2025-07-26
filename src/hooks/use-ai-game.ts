"use client";

import { useEffect, useRef, useState } from "react";
import { useKoraEngine } from "./use-kora-engine";
import { AIPlayer } from "@/engine/ai-player";
import { gameEngine } from "@/engine/kora-game-engine";

export function useAIGame(difficulty: "easy" | "medium" | "hard" = "medium") {
  const koraEngine = useKoraEngine();
  const aiPlayer = useRef(new AIPlayer(difficulty));
  const [isAIThinking, setIsAIThinking] = useState(false);

  // Mettre à jour la difficulté de l'IA
  useEffect(() => {
    aiPlayer.current.setDifficulty(difficulty);
  }, [difficulty]);

  // Gérer le tour de l'IA automatiquement
  useEffect(() => {
    const handleAITurn = () => {
      // Éviter les appels multiples simultanés
      if (isAIThinking) return;

      // Vérifier si c'est le tour de l'IA et si la partie est en cours
      if (
        koraEngine.phase === "playing" &&
        koraEngine.currentTurn === "opponent"
      ) {
        setIsAIThinking(true);

        // Délai pour simuler la réflexion de l'IA
        const thinkingTime =
          difficulty === "easy" ? 500 : difficulty === "medium" ? 1000 : 1500;

        setTimeout(() => {
          const gameState = gameEngine.getState();
          const chosenCard = aiPlayer.current.chooseCard(gameState);

          if (chosenCard) {
            const success = koraEngine.playCard(chosenCard.id, "opponent");
            if (!success) {
              console.warn(
                "L'IA n'a pas pu jouer la carte choisie:",
                chosenCard,
              );
            }
          }

          setIsAIThinking(false);
        }, thinkingTime);
      }
    };

    // Délai pour éviter les conflits avec les mises à jour d'état
    const timeoutId = setTimeout(handleAITurn, 100);

    return () => clearTimeout(timeoutId);
  }, [
    koraEngine.phase,
    koraEngine.currentTurn,
    isAIThinking,
    difficulty,
    koraEngine,
  ]);

  const startAIGame = () => {
    setIsAIThinking(false);
    koraEngine.startGame();
  };

  const playCardAgainstAI = (cardId: string) => {
    if (koraEngine.currentTurn === "player" && !isAIThinking) {
      const success = koraEngine.playCard(cardId, "player");
      return success;
    }
    return false;
  };

  return {
    // État du jeu
    ...koraEngine,

    // Actions spécifiques à l'IA
    startAIGame,
    playCardAgainstAI,

    // État de l'IA
    aiDifficulty: difficulty,
    isAIThinking,

    // Méthodes utilitaires
    setAIDifficulty: (newDifficulty: "easy" | "medium" | "hard") => {
      aiPlayer.current.setDifficulty(newDifficulty);
    },
  };
}
