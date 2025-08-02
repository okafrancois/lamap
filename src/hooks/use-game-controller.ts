"use client";

import { useState, useCallback, useEffect } from "react";
import { useKoraEngine } from "./use-kora-engine";
import { useGameUI } from "@/hooks/use-game-ui";
import { useUserDataContext } from "@/components/layout/user-provider";
import {
  type PlayerEntity,
  type AIDifficulty,
  type PlayedCard,
} from "@/engine/kora-game-engine";
import { type Card } from "common/deck";

export type GameMode = "ai" | "online" | "friend";

export function useGameController() {
  const koraEngine = useKoraEngine();
  const ui = useGameUI();
  const userData = useUserDataContext();
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
          id: userId,
          type: "user",
          isConnected: true,
          name: userName,
          koras: 100, // Koras de départ
        },
      ];

      if (mode === "ai") {
        players.push({
          id: "ai-opponent",
          type: "ai",
          isConnected: true,
          name: "IA",
          koras: 100,
          aiDifficulty: aiDifficulty ?? "medium",
        });
      } else {
        // Pour l'instant, ajouter un joueur placeholder
        players.push({
          id: "human-opponent",
          type: "user",
          isConnected: true,
          name: "Adversaire",
          koras: 100,
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
      // Utiliser les données de l'utilisateur connecté ou des valeurs par défaut
      const userId = userData?.user?.id ?? "user-1";
      const userName = userData?.user?.name ?? "Joueur";

      initializeGame(mode, userId, userName, ui.aiDifficulty);
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

    const success = koraEngine.playCard(selectedCardId, userPlayer.id);
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

  // Convertir l'état du moteur en format compatible avec l'UI
  const getGameState = useCallback((): {
    phase: "waiting" | "playing" | "victory" | "defeat";
    currentTurn: "player" | "opponent";
    playerCards: Card[];
    opponentCards: Card[];
    playedCards: PlayedCard[];
    playableCards: number[];
    currentRound: number;
    playerKoras: number;
    opponentKoras: number;
    playerWithHand: "player" | "opponent";
    currentBet: number;
    gameLog: { message: string; timestamp: number }[];
    isAIThinking: boolean;
  } => {
    const state = koraEngine.gameState;
    if (!state) {
      return {
        phase: "waiting" as "waiting" | "playing" | "victory" | "defeat",
        currentTurn: "player" as "player" | "opponent",
        playerCards: [] as Card[],
        opponentCards: [] as Card[],
        playedCards: [],
        playableCards: [] as number[],
        currentRound: 1,
        playerKoras: 100,
        opponentKoras: 100,
        playerWithHand: "player" as "player" | "opponent",
        currentBet: 10,
        gameLog: [],
        isAIThinking: false,
      };
    }

    const userPlayer = state.players.find((p) => p.type === "user");
    const opponentPlayer = state.players.find((p) => p.type !== "user");

    // Déterminer qui doit jouer
    const currentRoundCards = state.playedCards.filter(
      (p) => p.round === state.currentRound,
    );

    let currentTurn: "player" | "opponent" = "player";
    if (currentRoundCards.length === 0) {
      // Aucune carte jouée ce tour : c'est à celui qui a la main
      currentTurn = state.hasHandId === userPlayer?.id ? "player" : "opponent";
    } else if (currentRoundCards.length === 1) {
      // Une carte jouée : c'est à l'autre joueur
      const firstPlayerId = currentRoundCards[0]?.playerId;
      currentTurn = firstPlayerId === userPlayer?.id ? "opponent" : "player";
    }

    // Calculer les cartes jouables (indices)
    const playableCards: number[] = [];
    if (userPlayer?.hand) {
      userPlayer.hand.forEach((card, index) => {
        if (card.jouable) {
          playableCards.push(index);
        }
      });
    }

    // Déterminer la phase
    let phase: "waiting" | "playing" | "victory" | "defeat" = "waiting";
    if (state.status === "playing") {
      phase = "playing";
    } else if (state.status === "ended") {
      if (state.winnerId === userPlayer?.id) {
        phase = "victory";
      } else {
        phase = "defeat";
      }
    }

    return {
      phase,
      currentTurn,
      playerCards: userPlayer?.hand ?? [],
      opponentCards: opponentPlayer?.hand ?? [],
      playedCards: state.playedCards,
      playableCards,
      currentRound: state.currentRound,
      playerKoras: userPlayer?.koras ?? 0,
      opponentKoras: opponentPlayer?.koras ?? 0,
      playerWithHand:
        state.hasHandId === userPlayer?.id
          ? ("player" as const)
          : ("opponent" as const),
      currentBet: state.currentBet,
      gameLog: state.gameLog,
      isAIThinking: opponentPlayer?.isThinking ?? false,
    };
  }, [koraEngine.gameState]);

  // Effet pour montrer le modal de victoire
  useEffect(() => {
    const game = getGameState();
    if (game.phase === "victory" || game.phase === "defeat") {
      ui.actions.showVictory();
    }
  }, [getGameState, ui.actions]);

  return {
    // État du jeu
    game: getGameState(),

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
