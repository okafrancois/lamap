"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { api } from "@/trpc/react";
import { useUserDataContext } from "@/components/layout/user-provider";
import { type GamePhase, POLLING_INTERVALS } from "@/types/multiplayer";

interface UseMultiplayerGameProps {
  roomId: string;
}

export function useMultiplayerGame({ roomId }: UseMultiplayerGameProps) {
  const userData = useUserDataContext();
  const [currentPhase, setCurrentPhase] = useState<GamePhase>("waiting");
  const [lastVersion, setLastVersion] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  // Références pour éviter les re-renders inutiles
  const phaseRef = useRef(currentPhase);
  const lastActivityRef = useRef(Date.now());

  // ========== POLLING INTELLIGENT ==========

  // Calculer l'intervalle de polling selon la phase
  const getPollingInterval = useCallback((phase: GamePhase): number | false => {
    const interval = POLLING_INTERVALS[phase];

    // Optimisation: polling plus fréquent si activité récente
    const timeSinceActivity = Date.now() - lastActivityRef.current;
    if (timeSinceActivity < 10000 && interval !== false) {
      // 10 secondes
      return Math.min(interval, 1000); // Max 1 seconde si activité récente
    }

    return interval;
  }, []);

  // Query principale avec polling adaptatif
  const roomUpdatesQuery = api.multiplayer.getRoomUpdates.useQuery(
    { roomId, lastVersion },
    {
      refetchInterval: () => getPollingInterval(phaseRef.current),
      enabled: !!roomId && !!userData,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  );

  // Gérer les succès et erreurs
  useEffect(() => {
    const data = roomUpdatesQuery.data;
    if (data) {
      setLastVersion(data.room.version);
      setCurrentPhase(data.currentPhase);
      phaseRef.current = data.currentPhase;
      lastActivityRef.current = Date.now();
      setIsConnected(true);

      console.log(
        `🔄 Room update: ${data.currentPhase} (v${data.room.version})`,
      );
    }
  }, [roomUpdatesQuery.data]);

  useEffect(() => {
    if (roomUpdatesQuery.error) {
      console.error("❌ Erreur polling:", roomUpdatesQuery.error);
      setIsConnected(false);
    }
  }, [roomUpdatesQuery.error]);

  // ========== MUTATIONS ==========

  const toggleReadyMutation = api.multiplayer.toggleReady.useMutation();

  const leaveRoomMutation = api.multiplayer.leaveRoom.useMutation();

  const startGameMutation = api.multiplayer.startGame.useMutation();

  // Gérer les succès des mutations
  useEffect(() => {
    if (toggleReadyMutation.isSuccess) {
      lastActivityRef.current = Date.now();
      void roomUpdatesQuery.refetch();
    }
  }, [toggleReadyMutation.isSuccess, roomUpdatesQuery]);

  useEffect(() => {
    if (startGameMutation.isSuccess) {
      lastActivityRef.current = Date.now();
      setCurrentPhase("playing");
      phaseRef.current = "playing";
    }
  }, [startGameMutation.isSuccess]);

  // ========== ACTIONS ==========

  const toggleReady = useCallback(async () => {
    if (!roomId) return false;

    try {
      await toggleReadyMutation.mutateAsync({ roomId });
      return true;
    } catch (error) {
      console.error("❌ Erreur toggle ready:", error);
      return false;
    }
  }, [roomId, toggleReadyMutation]);

  const leaveRoom = useCallback(async () => {
    if (!roomId) return false;

    try {
      await leaveRoomMutation.mutateAsync({ roomId });
      return true;
    } catch (error) {
      console.error("❌ Erreur leave room:", error);
      return false;
    }
  }, [roomId, leaveRoomMutation]);

  const startGame = useCallback(async () => {
    if (!roomId) return false;

    try {
      const result = await startGameMutation.mutateAsync({ roomId });
      return result;
    } catch (error) {
      console.error("❌ Erreur start game:", error);
      return false;
    }
  }, [roomId, startGameMutation]);

  // ========== ÉTAT DÉRIVÉ ==========

  const roomData = roomUpdatesQuery.data;
  const isLoading = roomUpdatesQuery.isLoading;
  const error = roomUpdatesQuery.error;

  // Informations sur le joueur actuel
  const currentPlayer = roomData?.players.find(
    (p) => p.id === userData?.user.id,
  );
  const isHost = currentPlayer?.isHost ?? false;
  const isReady = currentPlayer?.isReady ?? false;

  // Informations sur la salle
  const allPlayersReady = roomData?.players.every((p) => p.isReady) ?? false;
  const canStartGame =
    isHost && allPlayersReady && (roomData?.players.length ?? 0) >= 2;

  // Statistiques de polling
  const pollingStats = {
    currentInterval: getPollingInterval(currentPhase),
    phase: currentPhase,
    lastUpdate: new Date(lastActivityRef.current),
    isConnected,
    version: lastVersion,
  };

  // ========== EFFETS ==========

  // Logger les changements de phase
  useEffect(() => {
    if (currentPhase !== phaseRef.current) {
      console.log(`🎮 Phase change: ${phaseRef.current} → ${currentPhase}`);
    }
  }, [currentPhase]);

  // Cleanup au démontage
  useEffect(() => {
    return () => {
      // Reset les références
      phaseRef.current = "waiting";
      lastActivityRef.current = Date.now();
    };
  }, []);

  return {
    // État de la salle
    roomData,
    currentPhase,
    isLoading,
    error,
    isConnected,

    // État du joueur
    currentPlayer,
    isHost,
    isReady,

    // État du jeu
    canStartGame,
    allPlayersReady,

    // Actions
    toggleReady,
    leaveRoom,
    startGame,

    // Données de debugging
    pollingStats,

    // Statut des mutations
    isTogglingReady: toggleReadyMutation.isPending,
    isLeavingRoom: leaveRoomMutation.isPending,
    isStartingGame: startGameMutation.isPending,
  };
}
