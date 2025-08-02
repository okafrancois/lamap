"use client";

import { useState, useCallback, useEffect } from "react";
import { useKoraEngine } from "./use-kora-engine";
import { useGameUI } from "@/hooks/use-game-ui";
import { useUserDataContext } from "@/components/layout/user-provider";
import {
  type PlayerEntity,
  type AIDifficulty,
} from "@/engine/kora-game-engine";
import { type Card } from "common/deck";
import { toast } from "sonner";

export type GameMode = "ai" | "online" | "friend";

export function useGameController() {
  const koraEngine = useKoraEngine();
  const ui = useGameUI();
  const userData = useUserDataContext();

  // Configurer le callback de victoire
  useEffect(() => {
    koraEngine.setOnVictoryCallback(() => {
      ui.actions.showVictory();
    });
  }, [koraEngine, ui.actions]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Initialiser le jeu avec des joueurs selon le mode choisi
  const initializeGame = useCallback(
    (
      mode: GameMode,
      userId: string,
      userName: string,
      aiDifficulty?: AIDifficulty,
    ) => {
      const players: PlayerEntity[] = [
        {
          username: userId,
          type: "user",
          isConnected: true,
          name: userName,
          koras: 100,
        },
      ];

      if (mode === "ai") {
        players.push({
          username: "ai-opponent",
          type: "ai",
          isConnected: true,
          name: "IA",
          koras: 100,
          aiDifficulty: aiDifficulty ?? "medium",
        });
      } else {
        players.push({
          username: "ai-opponent",
          type: "ai",
          isConnected: true,
          name: "IA",
          koras: 100,
          aiDifficulty: aiDifficulty ?? "medium",
        });
      }

      const bet = 10; // Mise par défaut
      const maxRounds = 5; // Tours maximum

      koraEngine.initializeEngine(bet, maxRounds, players);
      ui.actions.setGameMode(mode);
    },
    [koraEngine, ui.actions],
  );

  // Démarrer une nouvelle partie
  const startGame = useCallback(
    (mode: GameMode) => {
      if (!userData?.user) {
        toast.error("Vous devez être connecté pour jouer");
        return;
      }

      initializeGame(
        mode,
        userData.user.username,
        userData.user.name ?? userData.user.username,
        ui.aiDifficulty,
      );
      koraEngine.startNewGame();
    },
    [initializeGame, koraEngine, ui.aiDifficulty, userData],
  );

  // Nouvelle partie rapide (réutilise le mode actuel)
  const newGame = useCallback(() => {
    if (koraEngine.gameState) {
      koraEngine.startNewGame();
      setSelectedCardId(null);
      ui.actions.hideVictory();
    }
  }, [koraEngine, ui.actions]);

  // Jouer une carte
  const playCard = useCallback(() => {
    if (!selectedCardId || !koraEngine.gameState) return;

    const userPlayer = koraEngine.gameState.players.find(
      (p) => p.type === "user",
    );
    if (!userPlayer) return;

    const success = koraEngine.playCard(selectedCardId, userPlayer.username);
    if (success) {
      setSelectedCardId(null);
    }
  }, [selectedCardId, koraEngine]);

  // Sélectionner une carte
  const selectCard = useCallback((cardId: string) => {
    setSelectedCardId(cardId);
  }, []);

  // Hover une carte
  const hoverCard = useCallback(
    (cardIndex: number | null) => {
      ui.actions.setHoveredCard(cardIndex);
    },
    [ui.actions],
  );

  // Obtenir une carte par index
  const getCardByIndex = useCallback(
    (cardIndex: number): Card | null => {
      if (!koraEngine.gameState) return null;

      const userPlayer = koraEngine.gameState.players.find(
        (p) => p.type === "user",
      );
      if (!userPlayer?.hand) return null;

      return userPlayer.hand[cardIndex] ?? null;
    },
    [koraEngine.gameState],
  );

  // Obtenir l'index de la carte sélectionnée
  const getSelectedCardIndex = useCallback((): number | null => {
    if (!selectedCardId || !koraEngine.gameState) return null;

    const userPlayer = koraEngine.gameState.players.find(
      (p) => p.type === "user",
    );
    if (!userPlayer?.hand) return null;

    const index = userPlayer.hand.findIndex(
      (card) => card.id === selectedCardId,
    );
    return index >= 0 ? index : null;
  }, [selectedCardId, koraEngine.gameState]);

  // Gestion des modes de jeu
  const selectGameMode = useCallback(
    (mode: GameMode | null) => {
      ui.actions.setSelectedGameMode(mode);
    },
    [ui.actions],
  );

  const setAIDifficulty = useCallback(
    (difficulty: AIDifficulty) => {
      ui.actions.setAIDifficulty(difficulty);
      koraEngine.setAIDifficulty(difficulty);
    },
    [ui.actions, koraEngine],
  );

  // Effet pour déclencher automatiquement l'IA
  useEffect(() => {
    const state = koraEngine.gameState;
    if (!state) return;

    const aiPlayer = state.players.find((p) => p.type === "ai");

    if (
      state.status === "playing" &&
      state.playerTurnUsername === aiPlayer?.username &&
      !aiPlayer.isThinking
    ) {
      // Petit délai pour l'UX
      const timer = setTimeout(() => {
        void koraEngine.triggerAITurn();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [koraEngine.gameState, koraEngine]);

  // Logique de victoire gérée directement dans le game engine

  return {
    // État du jeu direct
    gameState: koraEngine.gameState,
    currentUserId: userData?.user.username,

    // Interface utilisateur
    ui,

    // Actions principales
    startGame,
    newGame,
    playCard,
    selectCard,
    hoverCard,

    // Utilitaires
    getCardByIndex,
    getSelectedCardIndex,

    // Gestion des modes
    selectGameMode,
    setAIDifficulty,

    // Accès direct au moteur
    engine: koraEngine,
  };
}
