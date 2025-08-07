"use client";

import { useState, useCallback, useEffect } from "react";
import { useKoraEngine } from "./use-kora-engine";
import { useGameUI } from "@/hooks/use-game-ui";
import { useGameSounds } from "@/hooks/use-game-sounds";
import { useUserDataContext } from "@/components/layout/user-provider";
import { useGameSync } from "@/hooks/use-game-sync";
// Plus besoin de useMatchmaking, on utilise les routes game directement
import { api } from "@/trpc/react";
import {
  type PlayerEntity,
  type AIDifficulty,
  type Game,
} from "@/engine/kora-game-engine";
import { type Card } from "common/deck";
import { toast } from "sonner";
import { GameStatus } from "@prisma/client";

export type GameMode = "ai" | "online" | "friend";

export function useGameController(gameId: string | null = null) {
  const koraEngine = useKoraEngine();
  const ui = useGameUI();
  const userData = useUserDataContext();
  const gameSync = useGameSync();

  // État pour tracker si on a déjà initialisé cette partie
  const [initializedGameId, setInitializedGameId] = useState<string | null>(
    null,
  );

  // Query pour récupérer les infos de partie directement dans le hook
  const { data: gameInfo } = api.game.getGame.useQuery(
    { gameId: gameId! },
    {
      enabled: !!gameId && gameId.startsWith("game-"),
      refetchInterval: 2000, // Polling pour les updates multijoueur
    },
  );

  // Mutations pour créer/rejoindre des parties
  const createMultiplayerGame = api.game.createMultiplayerGame.useMutation();
  const joinGameMutation = api.game.joinGame.useMutation();
  // Gérer les sons du jeu
  useGameSounds(koraEngine.gameState);

  // Configurer le callback de victoire
  useEffect(() => {
    if (!koraEngine.gameState) return; // Attendre que l'engine soit initialisé

    koraEngine.setOnVictoryCallback(() => {
      ui.actions.showVictory();
    });
  }, [koraEngine.gameState, koraEngine, ui.actions]);

  // Configurer le sync automatique
  useEffect(() => {
    if (!userData || !koraEngine.gameState) return; // Attendre que l'engine soit initialisé

    koraEngine.setOnGameUpdateCallback((gameState) => {
      // Créer les données de jeu pour le sync
      const gameData = {
        id: gameState.gameId,
        gameState,
        actions: [], // TODO: implémenter les actions si nécessaire
        createdAt: Date.now(),
        needsSync: true,
      };

      // Sync immédiat
      void gameSync.syncGame(gameData);
    });
  }, [koraEngine.gameState, koraEngine, gameSync, userData]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  // Initialiser le jeu avec des joueurs selon le mode choisi
  const initializeGame = useCallback(
    (gameData: Game) => {
      const players: PlayerEntity[] = [
        {
          username,
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

      const bet = 100; // Mise par défaut
      const maxRounds = 5; // Tours maximum

      koraEngine.initializeEngine(bet, maxRounds, players, userName);
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

      if (mode === "ai") {
        // Utiliser la nouvelle méthode pour l'IA
        const userPlayer: PlayerEntity = {
          username: userData.user.username,
          type: "user",
          isConnected: true,
          name: userData.user.name ?? userData.user.username,
          koras: 100,
        };

        koraEngine.startAIGame(100, 5, userPlayer, ui.aiDifficulty);
      } else {
        // Pour le multijoueur, utiliser l'ancienne méthode (sera remplacée)
        initializeGame(
          mode,
          userData.user.username,
          userData.user.name ?? userData.user.username,
          ui.aiDifficulty,
        );
        koraEngine.startOnlineGame();
      }
    },
    [initializeGame, koraEngine, ui.aiDifficulty, userData],
  );

  const loadGame = useCallback(() => {
    if (!gameId || !gameInfo) {
      return;
    }

    // Si la partie est en cours (PLAYING/playing), initialiser l'engine

    if (
      gameInfo.status === GameStatus.PLAYING &&
      gameInfo.players.length === 2
    ) {
      // Éviter la réinitialisation si on a déjà initialisé cette partie
      if (initializedGameId === gameId) {
        return;
      }

      // Si on a des données de joueurs sauvegardées, les utiliser
      if (Array.isArray(gameInfo.players) && gameInfo.players.length > 0) {
        // Charger l'état dans l'engine
        koraEngine.initializeEngine(
          gameInfo.currentBet,
          gameInfo.maxRounds,
          gameInfo.players,
          gameInfo.hostUsername,
        );
        koraEngine.startNewGame();
      } else {
        // Initialiser l'engine avec les données de la partie
        koraEngine.initializeEngine(
          gameInfo.currentBet,
          gameInfo.maxRounds,
          gameInfo.players,
          gameInfo.hostUsername,
        );

        // Démarrer une nouvelle partie (génère les cartes)
        koraEngine.startNewGame();

        // Forcer une sync immédiate après la création
        setTimeout(() => {
          if (koraEngine.gameState) {
            const gameData = {
              id: koraEngine.gameState.gameId,
              gameState: koraEngine.gameState,
              actions: [],
              createdAt: Date.now(),
              needsSync: true,
            };
            void gameSync.syncGame(gameData);
          }
        }, 100);
      }

      // Marquer cette partie comme initialisée
      setInitializedGameId(gameId);
    }
    // Note: Plus d'auto-join, le bouton de join sera géré dans la page
  }, [gameId, gameInfo, koraEngine, initializedGameId, gameSync]);

  // Note: loadGame sera appelé dans l'useEffect principal plus bas

  // Créer une nouvelle partie avec configuration complète
  const createGame = useCallback(
    (config: {
      mode: GameMode;
      difficulty?: AIDifficulty;
      bet?: number;
      maxRounds?: number;
      hostUsername: string;
    }) => {
      if (!userData?.user) {
        toast.error("Vous devez être connecté pour jouer");
        return null;
      }

      // Générer un ID de partie unique
      const newGameId = `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      if (config.mode === "ai") {
        // Pour l'IA, démarrer immédiatement
        setTimeout(() => {
          initializeGame(
            config.mode,
            userData.user.username,
            userData.user.name ?? userData.user.username,
            config.difficulty,
          );
          koraEngine.startNewGame();
        }, 1000);
      } else if (config.mode === "online") {
        // Pour le multijoueur, initialiser la partie avec le créateur
        const userPlayer: PlayerEntity = {
          username: userData.user.username,
          type: "user",
          isConnected: true,
          name: userData.user.name ?? userData.user.username,
          koras: 100,
        };

        // Initialiser la partie multijoueur
        koraEngine.initializeOnlineGame(
          newGameId,
          config.bet ?? 100,
          config.maxRounds ?? 5,
          userPlayer,
        );

        // Créer la partie en BDD aussi
        const gameConfig = {
          name: `Partie de ${userData.user.username}`,
          bet: config.bet ?? 100,
          maxRounds: config.maxRounds ?? 5,
          isPrivate: false,
        };

        void createMultiplayerGame.mutateAsync(gameConfig);

        return newGameId;
      }

      return newGameId;
    },
    [userData, initializeGame, koraEngine, createMultiplayerGame],
  );

  // Rejoindre une partie multijoueur
  const joinGame = useCallback(
    async (gameIdToJoin?: string) => {
      const targetGameId = gameIdToJoin ?? gameId;

      if (!targetGameId || !userData?.user) {
        toast.error("Vous devez être connecté pour rejoindre une partie");
        return false;
      }

      try {
        // Rejoindre en BDD
        await joinGameMutation.mutateAsync({ gameId: targetGameId });

        // Ajouter le joueur dans l'engine local
        const userPlayer: PlayerEntity = {
          username: userData.user.username,
          type: "user",
          isConnected: true,
          name: userData.user.name ?? userData.user.username,
          koras: 100,
        };

        const success = koraEngine.joinOnlineGame(userPlayer);

        if (success && koraEngine.gameState?.players.length === 2) {
          // Démarrer la partie automatiquement quand les 2 joueurs sont présents
          koraEngine.startOnlineGame();
        }

        toast.success("Partie rejointe avec succès !");
        return true;
      } catch (error) {
        console.error("Erreur lors du join:", error);
        toast.error("Impossible de rejoindre la partie");
        return false;
      }
    },
    [userData, joinGameMutation, gameId, koraEngine],
  );

  // L'ancien joinGame est remplacé par le nouveau au-dessus

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
      state.status === GameStatus.PLAYING &&
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

  useEffect(() => {
    if (gameId) {
      loadGame();
    } else {
      // Pas de gameId = retour à la sélection, on nettoie tout
      koraEngine.resetEngine();
      ui.actions.hideVictory();
      setSelectedCardId(null);
    }
  }, [gameId, gameInfo, loadGame, koraEngine, ui.actions]);

  // Logique de victoire gérée directement dans le game engine

  return {
    // État du jeu direct
    gameState: koraEngine.gameState,
    currentUserId: userData?.user.username,
    gameInfo, // Exposer gameInfo pour la page

    // Interface utilisateur
    ui,

    // Actions principales
    startGame,
    newGame,
    playCard,
    selectCard,
    hoverCard,

    // Nouvelle gestion des parties
    createGame,
    joinGame,

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
