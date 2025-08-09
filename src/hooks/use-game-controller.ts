"use client";

import { useState, useCallback, useEffect } from "react";
import { useKoraEngine } from "./use-kora-engine";
import { useGameUI } from "@/hooks/use-game-ui";
import { useGameSounds } from "@/hooks/use-game-sounds";
import { useUserDataContext } from "@/components/layout/user-provider";
import { useGameSync } from "@/hooks/use-game-sync";
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
  const koraEngine = useKoraEngine();
  const ui = useGameUI();
  const userData = useUserDataContext();
  const gameSync = useGameSync();

  const [initializedGameId, setInitializedGameId] = useState<string | null>(
    null,
  );

  const { data: gameInfo } = api.game.getGame.useQuery(
    { gameId: gameId! },
    {
      enabled: !!gameId && gameId.startsWith("game-"),
      refetchInterval: 10000,
      refetchIntervalInBackground: false,
    },
  );

  const joinGameMutation = api.game.joinGame.useMutation();
  const saveGameMutation = api.game.saveGame.useMutation();
  useGameSounds(koraEngine.gameState);

  useEffect(() => {
    if (!koraEngine.gameState) return;

    koraEngine.setOnVictoryCallback(() => {
      ui.actions.showVictory();
    });
  }, [koraEngine.gameState, koraEngine, ui.actions]);

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

      void gameSync.syncGame(gameData);
    });
  }, [koraEngine.gameState, koraEngine, gameSync, userData]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

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

    if (initializedGameId === gameId) {
      const currentState = koraEngine.gameState;
      if (
        currentState &&
        (currentState.version !== gameInfo.version ||
          currentState.lastSyncedAt?.getTime() !==
            gameInfo.lastSyncedAt?.getTime())
      ) {
        koraEngine.updateState(gameInfo);
      }
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

      let state: Game | null = null;

      if (config.mode === "AI") {
        state = koraEngine.createNewVsAiGame({
          mode: config.mode,
          maxRounds: config.maxRounds,
          aiDifficulty: config.aiDifficulty ?? "medium",
          currentBet: config.currentBet,
          isPrivate: config.isPrivate,
          joinCode: config.joinCode,
          roomName: roomName,
          maxPlayers: 2,
          hostUsername: currentUser.username,
          players,
        });
      } else {
        state = koraEngine.createNewGame({
          mode: config.mode,
          maxRounds: config.maxRounds,
          aiDifficulty: null,
          currentBet: config.currentBet,
          isPrivate: config.isPrivate,
          joinCode: config.joinCode,
          roomName: roomName,
          maxPlayers: 2,
          hostUsername: currentUser.username,
          players,
        });
      }

      if (state) {
        const gameDataForSave = {
          ...state,
          actions: [],
        };
        saveGameMutation.mutate(gameDataForSave);
        return state.gameId;
      }

      return null;
    },
    [userData, koraEngine, saveGameMutation],
  );

  const joinGame = useCallback(
    async (gameIdToJoin?: string) => {
      const targetGameId = gameIdToJoin ?? gameId;

      if (!targetGameId || !userData?.user) {
        toast.error("Vous devez être connecté pour rejoindre une partie");
        return false;
      }

      try {
        await joinGameMutation.mutateAsync({ gameId: targetGameId });

        const userPlayer: PlayerEntity = {
          username: userData.user.username,
          type: "user",
          isConnected: true,
          name: userData.user.name ?? userData.user.username,
          koras: 100,
        };

        const success = koraEngine.joinOnlineGame(userPlayer);

        if (success && koraEngine.gameState?.players.length === 2) {
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

  const playCard = useCallback(() => {
    if (!selectedCardId || !koraEngine.gameState) return;

    const userPlayer = koraEngine.gameState.players.find(
      (p) => p.username === userData?.user?.username,
    );
    if (!userPlayer) return;

    const success = koraEngine.playCard(selectedCardId, userPlayer.username);
    if (success) {
      setSelectedCardId(null);
    }
  }, [selectedCardId, koraEngine, userData]);

  const selectCard = useCallback((cardId: string) => {
    setSelectedCardId(cardId);
  }, []);

  const hoverCard = useCallback(
    (cardIndex: number | null) => {
      ui.actions.setHoveredCard(cardIndex);
    },
    [ui.actions],
  );

  const getCardByIndex = useCallback(
    (cardIndex: number): Card | null => {
      if (!koraEngine.gameState) return null;

      const userPlayer = koraEngine.gameState.players.find(
        (p) => p.username === userData?.user?.username,
      );
      if (!userPlayer?.hand) return null;

      return userPlayer.hand[cardIndex] ?? null;
    },
    [koraEngine.gameState, userData],
  );

  const getSelectedCardIndex = useCallback((): number | null => {
    if (!selectedCardId || !koraEngine.gameState) return null;

    const userPlayer = koraEngine.gameState.players.find(
      (p) => p.username === userData?.user?.username,
    );
    if (!userPlayer?.hand) return null;

    const index = userPlayer.hand.findIndex(
      (card) => card.id === selectedCardId,
    );
    return index >= 0 ? index : null;
  }, [selectedCardId, koraEngine.gameState, userData]);

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

  useEffect(() => {
    const state = koraEngine.gameState;
    if (!state) return;

    const aiPlayer = state.players.find((p) => p.type === "ai");

    if (
      state.status === GameStatus.PLAYING &&
      state.playerTurnUsername === aiPlayer?.username &&
      !aiPlayer.isThinking
    ) {
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

  return {
    gameState: koraEngine.gameState,
    currentUserId: userData?.user.username,
    gameInfo, // Exposer gameInfo pour la page
    ui,

    startGame,
    newGame,
    playCard,
    selectCard,
    hoverCard,

    createGame,
    joinGame,

    getCardByIndex,
    getSelectedCardIndex,

    selectGameMode,
    setAIDifficulty,

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
