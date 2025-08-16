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
import { useRouter } from "next/navigation";

export function useGameController(gameId: string | null = null) {
  const koraEngine = useKoraEngine();
  const ui = useGameUI();
  const userData = useUserDataContext();
  const gameSync = useGameSync();
  const router = useRouter();
  const [initializedGameId, setInitializedGameId] = useState<string | null>(
    null,
  );

  const { data: gameInfo, refetch: refetchGameInfo } =
    api.game.getGame.useQuery(
      { gameId: gameId! },
      {
        enabled: !!gameId && gameId.startsWith("game-"),
        refetchInterval: () => {
          const gameDatas = koraEngine.gameState;
          if (!gameDatas) return false;

          if (gameDatas.status === GameStatus.WAITING) {
            return 1000;
          }

          if (gameDatas.mode === "AI") {
            return false;
          }

          if (gameDatas.players.length < 2) {
            return 1000;
          }

          if (
            gameDatas?.status === GameStatus.PLAYING &&
            gameDatas.playerTurnUsername === userData?.user?.username
          ) {
            return false;
          }

          if (
            gameDatas?.status === GameStatus.PLAYING &&
            gameDatas.playerTurnUsername !== userData?.user?.username
          ) {
            return 1000;
          }
          if (gameDatas?.status === GameStatus.ENDED) {
            return false;
          }
          return false;
        },
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

  // Détecter la fin de partie lors de la synchronisation
  useEffect(() => {
    if (!koraEngine.gameState) return;

    // Si la partie est terminée et que la modal n'est pas encore affichée
    if (
      koraEngine.gameState.status === GameStatus.ENDED &&
      !ui.showVictoryModal
    ) {
      // Attendre un peu pour s'assurer que toutes les données sont synchronisées
      setTimeout(() => {
        ui.actions.showVictory();
      }, 500);
    }
  }, [
    koraEngine.gameState?.status,
    ui.showVictoryModal,
    ui.actions,
    koraEngine.gameState,
  ]);

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
  const [isPlayingCard, setIsPlayingCard] = useState(false);

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

      if (
        gameInfo.status === GameStatus.WAITING &&
        gameInfo.players.length === 2
      ) {
        setTimeout(() => {
          koraEngine.startGame();
        }, 200);
      }
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
        // Rejoindre en BDD côté serveur
        await joinGameMutation.mutateAsync({ gameId: targetGameId });

        void refetchGameInfo();
        router.refresh();

        toast.success("Partie rejointe avec succès !");
        return true;
      } catch (error) {
        console.error("Erreur lors du join:", error);
        toast.error("Impossible de rejoindre la partie");
        return false;
      }
    },
    [userData, joinGameMutation, gameId, refetchGameInfo, router],
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
    // Protection contre les double-clics
    if (isPlayingCard || !selectedCardId || !koraEngine.gameState) return;

    const userPlayer = koraEngine.gameState.players.find(
      (p) => p.username === userData?.user?.username,
    );
    if (!userPlayer) return;

    // Vérifier que la carte est toujours dans la main du joueur
    const cardStillInHand = userPlayer.hand?.find(
      (card) => card.id === selectedCardId,
    );
    if (!cardStillInHand) {
      console.warn("Card not found in hand, resetting selection");
      setSelectedCardId(null);
      return;
    }

    // Marquer comme en cours de jeu
    setIsPlayingCard(true);

    try {
      const success = koraEngine.playCard(selectedCardId, userPlayer.username);
      if (success) {
        setSelectedCardId(null);
      }
    } finally {
      // Libérer le verrou après un délai
      setTimeout(() => {
        setIsPlayingCard(false);
      }, 500);
    }
  }, [selectedCardId, koraEngine, userData, isPlayingCard]);

  const selectCard = useCallback(
    (cardId: string) => {
      // Éviter de sélectionner pendant qu'une carte est en cours de jeu
      if (isPlayingCard) return;

      setSelectedCardId(cardId);
    },
    [isPlayingCard],
  );

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
      }, 500);

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

    // État de l'action en cours
    isPlayingCard,

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
