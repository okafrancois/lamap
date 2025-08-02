"use client";

import { type GameState } from "@/engine/kora-game-engine";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/server/api/root";

// ========== CLIENT TRPC ==========

const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      headers: () => {
        // Récupérer le token de session si nécessaire
        return {};
      },
    }),
  ],
});

// ========== TYPES ==========

export interface LocalGameData {
  id: string;
  gameState: GameState;
  actions: LocalGameAction[];
  createdAt: number;
  syncedAt?: number;
  needsSync: boolean;
}

export interface LocalGameAction {
  id: string;
  gameId: string;
  type: string;
  payload: unknown;
  timestamp: number;
  playerId: string;
  round: number;
  synced: boolean;
}

export interface SyncQueueItem {
  type: "game" | "action" | "stats";
  data: unknown;
  timestamp: number;
  retries: number;
}

// ========== STOCKAGE LOCAL ==========

class LocalGameStorage {
  private readonly STORAGE_KEY = "kora-games";
  private readonly SYNC_QUEUE_KEY = "kora-sync-queue";
  private readonly STATS_KEY = "kora-user-stats";

  // Sauvegarder une partie localement
  saveGame(gameData: LocalGameData): void {
    try {
      const games = this.getAllGames();
      games[gameData.id] = gameData;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(games));
    } catch (error) {
      console.error("Erreur lors de la sauvegarde locale:", error);
    }
  }

  // Récupérer une partie
  getGame(gameId: string): LocalGameData | null {
    try {
      const games = this.getAllGames();
      return games[gameId] ?? null;
    } catch (error) {
      console.error("Erreur lors de la récupération:", error);
      return null;
    }
  }

  // Récupérer toutes les parties
  getAllGames(): Record<string, LocalGameData> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error("Erreur lors de la récupération des parties:", error);
      return {};
    }
  }

  // Ajouter une action à la queue de sync
  addToSyncQueue(item: SyncQueueItem): void {
    try {
      const queue = this.getSyncQueue();
      queue.push(item);
      localStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error("Erreur lors de l'ajout à la queue:", error);
    }
  }

  // Récupérer la queue de sync
  getSyncQueue(): SyncQueueItem[] {
    try {
      const data = localStorage.getItem(this.SYNC_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Erreur lors de la récupération de la queue:", error);
      return [];
    }
  }

  // Nettoyer la queue après sync
  clearSyncQueue(): void {
    try {
      localStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify([]));
    } catch (error) {
      console.error("Erreur lors du nettoyage de la queue:", error);
    }
  }

  // Marquer une partie comme synchronisée
  markGameSynced(gameId: string): void {
    try {
      const games = this.getAllGames();
      if (games[gameId]) {
        games[gameId].syncedAt = Date.now();
        games[gameId].needsSync = false;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(games));
      }
    } catch (error) {
      console.error("Erreur lors du marquage sync:", error);
    }
  }

  // Nettoyer les anciennes parties (garder 50 max)
  cleanup(): void {
    try {
      const games = this.getAllGames();
      const gameArray = Object.values(games).sort(
        (a, b) => b.createdAt - a.createdAt,
      );

      if (gameArray.length > 50) {
        const toKeep = gameArray.slice(0, 50);
        const newGames: Record<string, LocalGameData> = {};

        toKeep.forEach((game) => {
          newGames[game.id] = game;
        });

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newGames));
      }
    } catch (error) {
      console.error("Erreur lors du nettoyage:", error);
    }
  }
}

// ========== SERVICE DE SYNC ==========

class GameSyncService {
  private storage = new LocalGameStorage();
  private syncInProgress = false;
  private syncInterval: NodeJS.Timeout | null = null;

  // Démarrer la synchronisation automatique
  startAutoSync(): void {
    if (this.syncInterval) return;

    // Sync toutes les 30 secondes
    this.syncInterval = setInterval(() => {
      void this.syncPendingData();
    }, 30000);

    // Sync immédiate
    void this.syncPendingData();
  }

  // Arrêter la synchronisation automatique
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Sauvegarder une partie (local + queue sync)
  async saveGameData(gameState: GameState): Promise<void> {
    const gameData: LocalGameData = {
      id: gameState.gameId,
      gameState,
      actions: [], // Les actions seront ajoutées séparément
      createdAt: Date.now(),
      needsSync: true,
    };

    // Sauvegarde locale immédiate
    this.storage.saveGame(gameData);

    // Ajouter à la queue de sync
    this.storage.addToSyncQueue({
      type: "game",
      data: gameData,
      timestamp: Date.now(),
      retries: 0,
    });

    // Tenter un sync immédiat (non-bloquant)
    void this.syncPendingData();
  }

  // Sauvegarder une action (local + queue sync)
  async saveGameAction(action: LocalGameAction): Promise<void> {
    // Mettre à jour la partie locale
    const game = this.storage.getGame(action.gameId);
    if (game) {
      game.actions.push(action);
      game.needsSync = true;
      this.storage.saveGame(game);
    }

    // Ajouter à la queue de sync
    this.storage.addToSyncQueue({
      type: "action",
      data: action,
      timestamp: Date.now(),
      retries: 0,
    });

    // Tenter un sync immédiat (non-bloquant)
    void this.syncPendingData();
  }

  // Synchroniser les données en attente
  private async syncPendingData(): Promise<void> {
    if (this.syncInProgress) return;
    this.syncInProgress = true;

    try {
      const queue = this.storage.getSyncQueue();
      const successful: number[] = [];

      for (let i = 0; i < queue.length; i++) {
        const item = queue[i];
        if (!item) continue;

        try {
          await this.syncItem(item);
          successful.push(i);
        } catch (error) {
          console.warn(`Échec sync item ${i}:`, error);

          // Incrémenter les tentatives
          item.retries++;

          // Abandonner après 5 tentatives
          if (item.retries >= 5) {
            successful.push(i);
          }
        }
      }

      // Nettoyer les items synchronisés
      if (successful.length > 0) {
        const newQueue = queue.filter(
          (_, index) => !successful.includes(index),
        );
        localStorage.setItem("kora-sync-queue", JSON.stringify(newQueue));
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  // Synchroniser un item spécifique avec tRPC
  private async syncItem(item: SyncQueueItem): Promise<void> {
    try {
      console.log("🔄 Tentative de sync:", item.type, item.data);

      switch (item.type) {
        case "game":
          if (this.isLocalGameData(item.data)) {
            const result = await trpcClient.game.saveGame.mutate(item.data);
            console.log("✅ Sync game réussi:", result);
            this.storage.markGameSynced(item.data.id);
          }
          break;

        case "action":
          if (this.isLocalGameAction(item.data)) {
            const result = await trpcClient.game.saveAction.mutate(item.data);
            console.log("✅ Sync action réussi:", result);
          }
          break;

        case "stats":
          if (this.isStatsData(item.data)) {
            const result = await trpcClient.game.updateStats.mutate(item.data);
            console.log("✅ Sync stats réussi:", result);
          }
          break;

        default:
          throw new Error(`Type de sync inconnu: ${item.type}`);
      }
    } catch (error) {
      console.error("❌ Échec sync item:", error);
      throw new Error(
        `Sync failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // Guards de type pour la validation
  private isLocalGameData(data: unknown): data is LocalGameData {
    return (
      typeof data === "object" &&
      data !== null &&
      "id" in data &&
      "gameState" in data &&
      "needsSync" in data
    );
  }

  private isLocalGameAction(data: unknown): data is LocalGameAction {
    return (
      typeof data === "object" &&
      data !== null &&
      "id" in data &&
      "gameId" in data &&
      "type" in data
    );
  }

  private isStatsData(data: unknown): data is Record<string, unknown> {
    return typeof data === "object" && data !== null;
  }

  // Forcer la synchronisation immédiate
  async forcSync(): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      console.log("🚀 Début du sync forcé...");

      // Vérifier la queue avant
      const queueBefore = this.storage.getSyncQueue();
      console.log(
        `📋 Queue avant sync: ${queueBefore.length} items`,
        queueBefore,
      );

      if (queueBefore.length === 0) {
        console.log("✅ Aucun item à synchroniser");
        return { success: true, errors: [] };
      }

      await this.syncPendingData();

      // Vérifier s'il reste des items non synchronisés
      const queueAfter = this.storage.getSyncQueue();
      console.log(
        `📋 Queue après sync: ${queueAfter.length} items`,
        queueAfter,
      );

      if (queueAfter.length > 0) {
        errors.push(`${queueAfter.length} items encore en attente de sync`);
      }

      const success = errors.length === 0;
      console.log(
        success ? "✅ Sync forcé réussi !" : "❌ Sync forcé partiel",
        { errors },
      );

      return { success, errors };
    } catch (error) {
      console.error("❌ Erreur générale sync forcé:", error);
      errors.push(`Erreur de sync: ${error}`);
      return { success: false, errors };
    }
  }

  // Récupérer une partie (local d'abord, puis serveur)
  async getGame(gameId: string): Promise<LocalGameData | null> {
    // Vérifier en local d'abord
    let game = this.storage.getGame(gameId);
    if (game) return game;

    // Sinon, essayer de récupérer du serveur via tRPC
    try {
      const response = await fetch(
        `/api/trpc/game.getGame?input=${encodeURIComponent(JSON.stringify({ gameId }))}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      if (response.ok) {
        const result = await response.json();
        const serverGame = result.result?.data;

        if (serverGame) {
          // Convertir et sauvegarder localement
          game = this.serverToLocalGame(serverGame);
          this.storage.saveGame(game);

          return game;
        }
      }
    } catch (error) {
      console.warn("Impossible de récupérer la partie du serveur:", error);
    }

    return null;
  }

  // Convertir une partie serveur en partie locale
  private serverToLocalGame(serverGame: any): LocalGameData {
    return {
      id: serverGame.gameId,
      gameState: serverGame.gameState,
      actions:
        serverGame.actions?.map((a: any) => ({
          id: a.id,
          gameId: a.gameId,
          type: a.actionType,
          payload: a.payload,
          timestamp: new Date(a.timestamp).getTime(),
          playerId: a.playerId,
          round: a.round,
          synced: true,
        })) || [],
      createdAt: new Date(serverGame.startedAt).getTime(),
      syncedAt: Date.now(),
      needsSync: false,
    };
  }

  // Nettoyage périodique
  cleanup(): void {
    this.storage.cleanup();
  }

  // Debug: obtenir l'état de la queue de sync
  getSyncStatus(): { queue: SyncQueueItem[]; pending: number } {
    const queue = this.storage.getSyncQueue();
    return {
      queue,
      pending: queue.length,
    };
  }
}

// ========== INSTANCE SINGLETON ==========

export const gameSync = new GameSyncService();

// Auto-start de la synchronisation
if (typeof window !== "undefined") {
  gameSync.startAutoSync();

  // Nettoyage au chargement
  gameSync.cleanup();

  // Nettoyage à la fermeture
  window.addEventListener("beforeunload", () => {
    gameSync.stopAutoSync();
  });
}
