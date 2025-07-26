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
      console.log("🤖 Check IA:", {
        phase: koraEngine.phase,
        currentTurn: koraEngine.currentTurn,
        isAIThinking,
      });

      // Éviter les appels multiples simultanés
      if (isAIThinking) return;

      // Vérifier si c'est le tour de l'IA et si la partie est en cours
      if (
        koraEngine.phase === "playing" &&
        koraEngine.currentTurn === "opponent"
      ) {
        console.log("🤖 IA va jouer !");
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
  }, [koraEngine.phase, koraEngine.currentTurn, isAIThinking, difficulty]);

  const startAIGame = () => {
    console.log("🎮 Démarrage de la partie contre l'IA");
    setIsAIThinking(false);
    koraEngine.startGame();
    console.log("🎮 Phase après démarrage:", koraEngine.phase);
  };

  const playCardAgainstAI = (cardId: string) => {
    console.log(
      "🎯 Joueur joue carte:",
      cardId,
      "currentTurn:",
      koraEngine.currentTurn,
    );
    if (koraEngine.currentTurn === "player" && !isAIThinking) {
      const success = koraEngine.playCard(cardId, "player");
      console.log(
        "🎯 Carte jouée avec succès:",
        success,
        "nouveau tour:",
        koraEngine.currentTurn,
      );
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
