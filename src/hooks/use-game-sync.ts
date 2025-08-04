"use client";

import { useCallback, useEffect, useRef } from "react";
import { api } from "@/trpc/react";
import type { GameAction, GameState } from "@/engine/kora-game-engine";

// Types pour le sync local
interface LocalGameData {
  id: string;
  gameState: GameState;
  actions: GameAction[];
  createdAt: number;
  needsSync: boolean;
  syncedAt?: number;
}

export function useGameSync() {
  const saveGameMutation = api.game.saveGame.useMutation();
  const saveActionMutation = api.game.saveAction.useMutation();
  const updateStatsMutation = api.game.updateStats.useMutation();

  const syncInProgress = useRef(false);
  const syncInterval = useRef<NodeJS.Timeout | null>(null);

  // Sync immédiat d'un jeu
  const syncGame = useCallback(
    async (gameData: LocalGameData): Promise<boolean> => {
      try {
        console.log("🔄 Sync jeu:", gameData.gameState.gameId);
        await saveGameMutation.mutateAsync(gameData);

        // Marquer comme synchronisé dans localStorage
        localStorage.setItem(
          `kora-game-${gameData.gameState.gameId}`,
          JSON.stringify({
            ...gameData,
            needsSync: false,
            syncedAt: Date.now(),
          }),
        );

        console.log("✅ Jeu synchronisé:", gameData.gameState.gameId);
        return true;
      } catch (error) {
        console.error("❌ Erreur sync jeu:", error);
        return false;
      }
    },
    [saveGameMutation],
  );

  // Sync de tous les jeux en attente
  const syncAllPendingGames = useCallback(async (): Promise<{
    success: number;
    errors: number;
  }> => {
    if (syncInProgress.current) {
      return { success: 0, errors: 0 };
    }

    syncInProgress.current = true;
    let success = 0;
    let errors = 0;

    try {
      // Récupérer tous les jeux avec needsSync: true
      const localGames = Object.keys(localStorage)
        .filter((key) => key.startsWith("kora-game-"))
        .map((key) => {
          try {
            return JSON.parse(
              localStorage.getItem(key) ?? "{}",
            ) as LocalGameData;
          } catch {
            return null;
          }
        })
        .filter((game) => game?.needsSync);

      console.log(`🎮 ${localGames.length} jeux à synchroniser`);
      for (const game of localGames) {
        if (!game) continue;
        const result = await syncGame(game);
        if (result) {
          success++;
        } else {
          errors++;
        }
      }

      console.log(`📊 Sync terminé: ${success} réussis, ${errors} erreurs`);
    } finally {
      syncInProgress.current = false;
    }

    return { success, errors };
  }, [syncGame]);

  // Auto-sync toutes les 30 secondes
  useEffect(() => {
    const startAutoSync = () => {
      if (syncInterval.current) return;

      syncInterval.current = setInterval(() => {
        void syncAllPendingGames();
      }, 30000);

      // Sync immédiat au démarrage
      void syncAllPendingGames();
    };

    const stopAutoSync = () => {
      if (syncInterval.current) {
        clearInterval(syncInterval.current);
        syncInterval.current = null;
      }
    };

    startAutoSync();

    return stopAutoSync;
  }, [syncAllPendingGames]);

  return {
    syncGame,
    syncAllPendingGames,
    isLoading: saveGameMutation.isPending,
  };
}
