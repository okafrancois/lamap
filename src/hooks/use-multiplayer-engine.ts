"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { api } from "@/trpc/react";
import { useUserDataContext } from "@/components/layout/user-provider";
import {
  MultiplayerGameEngine,
  type MultiplayerGameConfig,
} from "@/engine/multiplayer-game-engine";
import {
  type GameState,
  type PlayerEntity,
  type AIDifficulty,
} from "@/engine/kora-game-engine";
import type { GameEvent } from "@/types/multiplayer";

interface UseMultiplayerEngineProps {
  roomId: string;
  gameId: string;
  isHost: boolean;
  initialGameState?: GameState;
  roomPlayers?: Array<{
    id: string;
    username: string;
    koras: number;
    isReady: boolean;
    isHost: boolean;
  }>;
}

export function useMultiplayerEngine({
  roomId,
  gameId,
  isHost,
  initialGameState,
  roomPlayers,
}: UseMultiplayerEngineProps) {
  const userData = useUserDataContext();
  const [gameState, setGameState] = useState<GameState | null>(
    initialGameState ?? null,
  );
  const [isEngineReady, setIsEngineReady] = useState(false);

  const engineRef = useRef<MultiplayerGameEngine | null>(null);
  const eventsProcessed = useRef(new Set<string>());
  const hasStartedGame = useRef(false);

  // ========== MUTATIONS TRPC ==========

  const sendEventMutation = api.multiplayer.sendGameEvent.useMutation({
    onError: (error) => {
      console.error("❌ Erreur envoi événement:", error);
    },
  });

  const utils = api.useUtils();

  // ========== INITIALISATION DU MOTEUR ==========

  const initializeEngine = useCallback(
    (state?: GameState) => {
      if (!userData?.user) return;

      const config: MultiplayerGameConfig = {
        roomId,
        gameId,
        currentUserId: userData.user.username,
        isHost,
      };

      let players: PlayerEntity[];
      let bet: number;
      let maxRounds: number;

      if (initialGameState) {
        // Utiliser l'état fourni
        players = initialGameState.players;
        bet = initialGameState.currentBet;
        maxRounds = initialGameState.maxRounds;
      } else if (roomPlayers && roomPlayers.length > 0) {
        // Utiliser les joueurs de la salle
        players = roomPlayers.map((player) => ({
          username: player.username,
          type: "user" as const,
          isConnected: true,
          name: player.username,
          koras: player.koras,
        }));
        bet = 10; // TODO: Récupérer depuis la salle
        maxRounds = 5; // TODO: Récupérer depuis la salle
      } else {
        // État par défaut pour une nouvelle partie
        players = [
          {
            username: userData.user.username,
            type: "user",
            isConnected: true,
            name: userData.user.username,
            koras: 100,
          },
          // L'autre joueur sera ajouté dynamiquement
        ];
        bet = 10;
        maxRounds = 5;
      }

      const engine = new MultiplayerGameEngine(bet, maxRounds, players, config);

      // Configurer le client tRPC
      engine.setTRPCClient(sendEventMutation, utils);

      // Écouter les changements d'état
      engine.subscribe((newState) => {
        setGameState(newState);
      });

      // Gérer les événements reçus
      engine.setOnEventReceived((event) => {
        handleEventReceived(event);
      });

      // Restaurer l'état si fourni
      if (initialGameState) {
        engine.loadState(initialGameState);
      }

      engineRef.current = engine;
      setIsEngineReady(true);

      console.log("🎮 Moteur multi-joueur initialisé", config);

      // Si on a les joueurs mais pas d'état, démarrer automatiquement (une seule fois)
      if (
        roomPlayers &&
        roomPlayers.length > 0 &&
        !initialGameState &&
        !hasStartedGame.current
      ) {
        console.log("🚀 Démarrage automatique de la partie...");
        console.log(
          "📊 Joueurs disponibles:",
          roomPlayers.map((p) => p.username),
        );
        hasStartedGame.current = true;
        setTimeout(() => {
          console.log("🎯 Appel de startNewGame()...");
          engine.startNewGame();
          console.log("✅ startNewGame() appelé");
        }, 100); // Petit délai pour s'assurer que tout est prêt
      } else {
        console.log("❌ Pas de démarrage automatique:", {
          hasRoomPlayers: !!roomPlayers,
          roomPlayersLength: roomPlayers?.length,
          hasState: !!initialGameState,
          hasStarted: hasStartedGame.current,
        });
      }
    },
    [
      userData,
      roomId,
      gameId,
      isHost,
      sendEventMutation,
      utils,
      roomPlayers,
      initialGameState,
    ],
  );

  // ========== GESTION DES ÉVÉNEMENTS ==========

  const handleEventReceived = useCallback((event: GameEvent) => {
    // Éviter le traitement en double
    if (eventsProcessed.current.has(event.id)) {
      return;
    }
    eventsProcessed.current.add(event.id);

    console.log("📥 Traitement événement:", event.type, event.payload);

    // Le moteur traite déjà l'événement dans processReceivedEvent
    // Ici on peut ajouter des effets de bord (sons, notifications, etc.)

    // Nettoyer le cache des événements traités (garder seulement les 100 derniers)
    if (eventsProcessed.current.size > 100) {
      const oldestEvents = Array.from(eventsProcessed.current).slice(0, 50);
      oldestEvents.forEach((id) => eventsProcessed.current.delete(id));
    }
  }, []);

  // ========== MÉTHODES PUBLIQUES ==========

  const playCard = useCallback(
    (cardId: string) => {
      if (!engineRef.current || !userData?.user) {
        console.warn("Moteur non prêt pour jouer une carte");
        return false;
      }

      return engineRef.current.playCardByUsername(
        cardId,
        userData.user.username,
      );
    },
    [userData],
  );

  const startGame = useCallback(() => {
    if (!engineRef.current) {
      console.warn("Moteur non prêt pour démarrer");
      return;
    }

    if (!isHost) {
      console.warn("Seul l'hôte peut démarrer la partie");
      return;
    }

    engineRef.current.startNewGame();
  }, [isHost]);

  const canPlayCard = useCallback(
    (cardId: string) => {
      if (!engineRef.current || !userData?.user) return false;
      const player = engineRef.current.getPlayerByUsername(
        userData.user.username,
      );
      if (!player) return false;
      return engineRef.current.canPlayCard(cardId, player);
    },
    [userData],
  );

  const isPlayerTurn = useCallback(
    (playerUsername?: string) => {
      if (!engineRef.current) return false;
      const username = playerUsername ?? userData?.user.username;
      if (!username) return false;
      return engineRef.current.isPlayerTurnByUsername(username);
    },
    [userData],
  );

  const getVictoryType = useCallback(
    (playerUsername?: string) => {
      if (!engineRef.current)
        return { type: "none" as const, description: "", multiplier: 1 };
      const username = playerUsername ?? userData?.user.username;
      return engineRef.current.getVictoryType(username);
    },
    [userData],
  );

  const getVictoryMessage = useCallback((isPlayerWinner: boolean) => {
    if (!engineRef.current) return "";
    return engineRef.current.getVictoryMessage(isPlayerWinner);
  }, []);

  // ========== POLLING DES ÉVÉNEMENTS ==========

  const roomUpdatesQuery = api.multiplayer.getRoomUpdates.useQuery(
    { roomId },
    {
      refetchInterval: 2000, // 2 secondes
      enabled: isEngineReady,
    },
  );

  // Traiter les événements reçus
  useEffect(() => {
    const data = roomUpdatesQuery.data;
    if (!data?.events || !engineRef.current) return;

    // Traiter les nouveaux événements
    data.events.forEach((apiEvent) => {
      if (!eventsProcessed.current.has(apiEvent.id)) {
        // Adapter le format API vers le format attendu par le moteur
        const gameEvent: GameEvent = {
          id: apiEvent.id,
          gameId: apiEvent.gameId ?? "",
          playerId: apiEvent.playerId,
          type: apiEvent.type as any, // Type adapté
          payload: apiEvent.payload,
          timestamp: apiEvent.timestamp,
          processed: false,
        };
        engineRef.current?.processReceivedEvent(gameEvent);
      }
    });
  }, [roomUpdatesQuery.data]);

  // ========== EFFETS ==========

  // Initialiser le moteur
  useEffect(() => {
    if (!userData?.user) return;
    initializeEngine(initialGameState);

    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, [userData, initializeEngine, initialGameState]);

  // Démarrer le polling des événements
  useEffect(() => {
    if (!isEngineReady || !engineRef.current) return;

    engineRef.current.startEventPolling(1000); // 1 seconde

    return () => {
      engineRef.current?.stopEventPolling();
    };
  }, [isEngineReady]);

  // ========== ÉTAT DÉRIVÉ ==========

  const localPlayer = gameState?.players.find(
    (p) => p.username === userData?.user.username,
  );
  const isMyTurn = gameState?.playerTurnUsername === userData?.user.username;
  const canPlay = isMyTurn && gameState?.status === "playing";

  return {
    // État du jeu
    gameState,
    isEngineReady,

    // État du joueur local
    localPlayer,
    isMyTurn,
    canPlay,

    // Actions
    playCard,
    startGame,
    canPlayCard,
    isPlayerTurn,

    // Informations sur la victoire
    getVictoryType,
    getVictoryMessage,

    // Moteur brut (pour usage avancé)
    engine: engineRef.current,

    // Statuts
    isSendingEvent: sendEventMutation.isPending,
    eventError: sendEventMutation.error,

    // Debug
    eventsProcessedCount: eventsProcessed.current.size,
  };
}
