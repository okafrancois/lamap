"use client";

import { useState, useCallback, useEffect } from "react";
import { useKoraEngine } from "./use-kora-engine";
import { useGameUI } from "@/hooks/use-game-ui";
import { useGameSounds } from "@/hooks/use-game-sounds";
import { useUserDataContext } from "@/components/layout/user-provider";
import { useGameSync } from "@/hooks/use-game-sync";
import { useMatchmaking } from "@/hooks/use-matchmaking";
import { api } from "@/trpc/react";
import {
  type PlayerEntity,
  type AIDifficulty,
} from "@/engine/kora-game-engine";
import { type Card } from "common/deck";
import { toast } from "sonner";

export type GameMode = "ai" | "online" | "friend";

export function useGameController(gameId: string | null = null) {
  const koraEngine = useKoraEngine();
  const ui = useGameUI();
  const userData = useUserDataContext();
  const gameSync = useGameSync();
  const matchmaking = useMatchmaking();

  // Query pour charger les infos de la room si on a un roomId
  const { data: roomInfo } = api.multiplayer.getRoomUpdates.useQuery(
    { roomId: gameId!, lastVersion: 0 },
    {
      enabled: !!gameId && gameId.startsWith("cm"),
      refetchInterval: 2000, // Polling pour les updates
    },
  );

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
        id: `game-${gameState.gameId}`,
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

  const loadGameState = useCallback(() => {
    if (!gameId) return;

    // Détecter si c'est un roomId (commence par 'cm') ou un gameId (commence par 'game-')
    if (gameId.startsWith("cm")) {
      // C'est un roomId - les données seront chargées via la query roomInfo
      console.log("Chargement de la room:", gameId);

      // Si on a les infos de la room et qu'elle est en mode PLAYING, initialiser le jeu
      if (
        roomInfo &&
        roomInfo.room.status === "PLAYING" &&
        roomInfo.gameState
      ) {
        console.log("Room en mode PLAYING, initialisation du jeu multijoueur");

        // Créer les joueurs pour l'engine
        const players: PlayerEntity[] = roomInfo.players
          .filter((player) => player.username) // Filtrer les null
          .map((player) => ({
            username: player.username!,
            type: "user" as const,
            isConnected: true,
            name: player.username!,
            koras: player.koras,
          }));

        // Initialiser l'engine avec les données de la room
        koraEngine.initializeEngine(
          roomInfo.room.bet,
          roomInfo.room.maxRounds,
          players,
        );

        // Si on n'a pas encore de gameState, démarrer la partie
        if (
          !koraEngine.gameState ||
          koraEngine.gameState.status === "waiting"
        ) {
          koraEngine.startNewGame();
        }
      } else if (roomInfo && roomInfo.room.status === "WAITING") {
        console.log("Room en attente d'autres joueurs...");
      }
    } else if (gameId.startsWith("game-")) {
      // C'est un gameId classique - TODO: charger la partie
      console.log("Chargement de la partie:", gameId);
    }
  }, [gameId, roomInfo, koraEngine]);

  // Créer une nouvelle partie avec configuration complète
  const createGame = useCallback(
    (config: {
      mode: GameMode;
      difficulty?: AIDifficulty;
      bet?: number;
      maxRounds?: number;
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
        // Pour le multijoueur, créer une room
        const roomConfig = {
          name: `Partie de ${userData.user.username}`,
          bet: config.bet ?? 10,
          maxRounds: config.maxRounds ?? 5,
          isPrivate: false,
        };

        // Créer la room via matchmaking
        void matchmaking.createRoom(roomConfig);

        // Le newGameId sera l'ID de la room créée
        // (la redirection sera gérée par le hook matchmaking)
        return null; // Pas de gameId immédiat pour le multijoueur
      }

      return newGameId;
    },
    [userData, initializeGame, koraEngine, matchmaking],
  );

  // Rejoindre une partie existante
  const joinGame = useCallback(
    (gameId: string) => {
      if (!userData?.user) {
        toast.error("Vous devez être connecté pour jouer");
        return false;
      }

      // TODO: Implémenter la logique de rejoindre une partie
      console.log("Rejoindre la partie:", gameId);
      return true;
    },
    [userData],
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

  useEffect(() => {
    if (gameId) {
      loadGameState();
    } else {
      // Pas de gameId = retour à la sélection, on nettoie tout
      koraEngine.resetEngine();
      ui.actions.hideVictory();
      setSelectedCardId(null);
    }
  }, [gameId, loadGameState, koraEngine, ui.actions]);

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
