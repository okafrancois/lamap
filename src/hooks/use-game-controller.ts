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
  type GameConfig,
} from "@/engine/kora-game-engine";
import { type Card } from "common/deck";
import { toast } from "sonner";
import { type GameMode, GameStatus } from "@prisma/client";
import type { User } from "next-auth";

export function useGameController(gameId: string | null = null) {
  const [refetchInterval, setRefetchInterval] = useState<number | null>(null);
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
      ...(refetchInterval && { refetchInterval }),
    },
  );

  useEffect(() => {
    if (gameInfo?.status === GameStatus.PLAYING && gameInfo.mode === "ONLINE") {
      setRefetchInterval(2000);
    } else {
      setRefetchInterval(null);
    }
  }, [gameInfo?.status, gameInfo?.mode]);

  const joinGameMutation = api.game.joinGame.useMutation();
  const saveGameMutation = api.game.saveGame.useMutation();
  // Gérer les sons du jeu
  useGameSounds(koraEngine.gameState);

  // Configurer le callback de victoire
  useEffect(() => {
    if (!koraEngine.gameState) return;

    koraEngine.setOnVictoryCallback(() => {
      ui.actions.showVictory();
    });
  }, [koraEngine.gameState, koraEngine, ui.actions]);

  // Configurer le sync automatique
  useEffect(() => {
    if (!userData || !koraEngine.gameState) return;

    koraEngine.setOnGameUpdateCallback((gameState) => {
      const gameData = {
        id: gameState.gameId,
        gameState,
        actions: gameState.actions,
        createdAt: Date.now(),
        needsSync: true,
      };

      // Sync immédiat
      void gameSync.syncGame(gameData);
    });
  }, [koraEngine.gameState, koraEngine, gameSync, userData]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Démarrer une nouvelle partie
  const startGame = useCallback(() => {
    if (!userData?.user) {
      toast.error("Vous devez être connecté pour jouer");
      return;
    }

    koraEngine.startGame();
  }, [koraEngine, userData]);

  const loadGame = useCallback(() => {
    if (!gameId || !gameInfo) {
      return;
    }

    // Éviter la réinitialisation si on a déjà initialisé cette partie
    if (initializedGameId === gameId) {
      return;
    }

    const initializeGame = (gameData: Game) => {
      koraEngine.initializeEngine(gameData);
      ui.actions.setGameMode(gameData.mode);
    };

    if (!initializedGameId && gameInfo) {
      initializeGame(gameInfo);
    }

    // Marquer cette partie comme initialisée
    setInitializedGameId(gameId);
  }, [gameId, gameInfo, koraEngine, initializedGameId, ui]);

  // Note: loadGame sera appelé dans l'useEffect principal plus bas

  // Créer une nouvelle partie avec configuration complète
  const createGame = useCallback(
    (
      config: Pick<
        GameConfig,
        | "mode"
        | "aiDifficulty"
        | "currentBet"
        | "maxRounds"
        | "isPrivate"
        | "joinCode"
      >,
      currentUser: User,
    ) => {
      if (!userData?.user) {
        toast.error("Vous devez être connecté pour jouer");
        return null;
      }

      const players: PlayerEntity[] = [
        {
          username: currentUser.username,
          type: "user",
          isConnected: true,
          name: currentUser.name ?? currentUser.username,
          koras: Number(
            (currentUser as unknown as { koras?: number })?.koras ??
              userData?.user?.koras ??
              100,
          ),
        },
      ];

      const roomName = `Partie de ${currentUser.username} - ${config.mode}`;

      const state = koraEngine.createNewGame({
        mode: config.mode,
        maxRounds: config.maxRounds,
        aiDifficulty: config.mode === "AI" ? config.aiDifficulty : null,
        currentBet: config.currentBet,
        isPrivate: config.isPrivate,
        joinCode: config.joinCode,
        roomName: roomName,
        maxPlayers: 2,
        hostUsername: currentUser.username,
        players,
      });

      if (state) {
        // Démarrer automatiquement les parties AI
        if (config.mode === "AI") {
          setTimeout(() => {
            koraEngine.startGame();

            saveGameMutation.mutate({
              ...state,
              actions: [],
            });
          }, 100);
        } else {
          saveGameMutation.mutate({
            ...state,
            actions: [],
          });
        }

        return state.gameId;
      }

      return null;
    },
    [userData, koraEngine, saveGameMutation],
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
      const players = [koraEngine.gameState.players[0]!];

      if (koraEngine.gameState.mode === "AI") {
        players.push({
          username: getAiUsername(
            koraEngine.gameState.aiDifficulty as AIDifficulty,
          ),
          type: "ai",
          isConnected: true,
          koras: 0,
        });
      }

      koraEngine.createNewGame({
        mode: koraEngine.gameState.mode,
        maxRounds: koraEngine.gameState.maxRounds,
        aiDifficulty: koraEngine.gameState.aiDifficulty,
        currentBet: koraEngine.gameState.currentBet,
        isPrivate: koraEngine.gameState.isPrivate,
        roomName: koraEngine.gameState.roomName,
        maxPlayers: koraEngine.gameState.maxPlayers,
        hostUsername: koraEngine.gameState.hostUsername,
        joinCode: koraEngine.gameState.joinCode,
        players,
      });
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
    if (gameId && gameInfo) {
      loadGame();
    } else {
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

function getAiUsername(difficulty: AIDifficulty): string {
  const difficultyMap = {
    easy: "bindi-du-tierqua",
    medium: "le-ndoss",
    hard: "le-grand-bandi",
  };
  return `${difficultyMap[difficulty]} (bot)`;
}
