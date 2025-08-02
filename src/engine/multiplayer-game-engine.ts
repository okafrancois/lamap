"use client";

import {
  KoraGameEngine,
  type GameState,
  type GameAction,
  type PlayerEntity,
} from "./kora-game-engine";
import type { GameEvent, MultiplayerEventPayloads } from "@/types/multiplayer";
import { api } from "@/trpc/react";

export interface MultiplayerGameConfig {
  roomId: string;
  gameId: string;
  currentUserId: string;
  isHost: boolean;
}

export class MultiplayerGameEngine extends KoraGameEngine {
  private config: MultiplayerGameConfig;
  private pendingActions: GameAction[] = [];
  private lastEventTimestamp: Date = new Date();
  private eventPollingInterval?: NodeJS.Timeout;
  private onEventReceived?: (event: GameEvent) => void;

  // Injection des mutations tRPC (sera configuré par le hook)
  private sendEventMutation?: any;
  private queryClient?: any;

  constructor(
    bet: number,
    maxRounds: number,
    players: PlayerEntity[],
    config: MultiplayerGameConfig,
  ) {
    super(bet, maxRounds, players);
    this.config = config;
  }

  // ========== CONFIGURATION ==========

  public setTRPCClient(sendEventMutation: any, queryClient: any) {
    this.sendEventMutation = sendEventMutation;
    this.queryClient = queryClient;
  }

  public setOnEventReceived(callback: (event: GameEvent) => void) {
    this.onEventReceived = callback;
  }

  // ========== OVERRIDE DES MÉTHODES PRINCIPALES ==========

  public playCard(cardId: string, player: PlayerEntity): boolean {
    // Vérifier que c'est bien le joueur local qui joue
    if (player.username !== this.config.currentUserId) {
      console.warn("Tentative de jouer une carte pour un autre joueur");
      return false;
    }

    // Jouer la carte localement d'abord
    const success = super.playCard(cardId, player);

    if (success) {
      // Envoyer l'événement aux autres joueurs
      this.sendGameEvent("CARD_PLAYED", {
        cardId,
        playerUsername: player.username,
      });
    }

    return success;
  }

  // Méthode utilitaire pour jouer avec juste le username (pour les hooks)
  public playCardByUsername(cardId: string, playerUsername: string): boolean {
    const player = this.getPlayerByUsername(playerUsername);
    if (!player) {
      console.warn("Joueur introuvable:", playerUsername);
      return false;
    }
    return this.playCard(cardId, player);
  }

  public startNewGame(): void {
    // Seul l'hôte peut démarrer
    if (!this.config.isHost) {
      console.warn("Seul l'hôte peut démarrer la partie");
      return;
    }

    super.startNewGame();

    // Envoyer l'état du jeu à tous les joueurs
    this.sendGameEvent("GAME_START", {
      gameState: this.getState(),
    });
  }

  // ========== GESTION DES ÉVÉNEMENTS ==========

  private async sendGameEvent<T extends keyof MultiplayerEventPayloads>(
    type: T,
    payload: MultiplayerEventPayloads[T],
  ): Promise<void> {
    if (!this.sendEventMutation) {
      console.error("tRPC client non configuré");
      return;
    }

    try {
      await this.sendEventMutation.mutateAsync({
        roomId: this.config.roomId,
        gameId: this.config.gameId,
        type,
        payload,
      });

      console.log(`📤 Événement envoyé: ${type}`, payload);
    } catch (error) {
      console.error(`❌ Erreur envoi événement ${type}:`, error);
    }
  }

  // Traiter un événement reçu d'un autre joueur
  public processReceivedEvent(event: GameEvent): void {
    console.log(`📥 Événement reçu: ${event.type}`, event.payload);

    try {
      switch (event.type) {
        case "CARD_PLAYED":
          this.handleRemoteCardPlayed(event.payload);
          break;

        case "GAME_START":
          this.handleRemoteGameStarted(event.payload);
          break;

        case "GAME_STATE_UPDATE":
          this.handleRemoteStateUpdate(event.payload);
          break;

        case "TURN_CHANGE":
          this.handleRemoteTurnChange(event.payload);
          break;

        default:
          console.warn(`Événement non géré: ${event.type}`);
      }

      this.lastEventTimestamp = new Date(event.timestamp);

      // Callback pour les hooks
      if (this.onEventReceived) {
        this.onEventReceived(event);
      }
    } catch (error) {
      console.error(`❌ Erreur traitement événement ${event.type}:`, error);
    }
  }

  private handleRemoteCardPlayed(payload: any): void {
    const { cardId, playerUsername } = payload;

    // Ne pas traiter ses propres actions
    if (playerUsername === this.config.currentUserId) {
      return;
    }

    // Trouver le joueur et appliquer l'action
    const player = this.getPlayerByUsername(playerUsername);
    if (player) {
      super.playCard(cardId, player);
    }
  }

  private handleRemoteGameStarted(payload: any): void {
    const { gameState } = payload;

    // Synchroniser l'état de jeu
    this.setState(gameState);
  }

  private handleRemoteStateUpdate(payload: any): void {
    const { gameState } = payload;

    // Fusion intelligente des états
    this.mergeGameState(gameState);
  }

  private handleRemoteTurnChange(payload: any): void {
    const { playerTurnUsername } = payload;

    // TODO: Implémenter la mise à jour du tour
    // Pour l'instant, on laisse la synchronisation se faire via GAME_STATE_UPDATE
    console.log("Tour changé vers:", playerTurnUsername);
  }

  // ========== SYNCHRONISATION D'ÉTAT ==========

  private setState(newState: GameState): void {
    // Utiliser loadState de la classe de base
    this.loadState(newState);
  }

  private mergeGameState(remoteState: GameState): void {
    // Logique de fusion intelligente pour éviter les conflits
    const currentState = this.getState();

    // Toujours prendre la version la plus récente
    if (remoteState.version > currentState.version) {
      console.log(
        `🔄 Sync state: v${currentState.version} → v${remoteState.version}`,
      );

      // Préserver certaines données locales importantes
      const localPlayerData = currentState.players.find(
        (p) => p.username === this.config.currentUserId,
      );

      const newState = { ...remoteState };

      // Restaurer les données locales si nécessaire
      if (localPlayerData) {
        const playerIndex = newState.players.findIndex(
          (p) => p.username === this.config.currentUserId,
        );
        if (playerIndex !== -1 && newState.players[playerIndex]) {
          const currentPlayer = newState.players[playerIndex];
          newState.players[playerIndex] = {
            ...currentPlayer,
            hand: localPlayerData.hand, // Garder la main locale
            isThinking: localPlayerData.isThinking ?? false,
          };
        }
      }

      this.loadState(newState);
    }
  }

  // ========== POLLING DES ÉVÉNEMENTS ==========

  public startEventPolling(intervalMs = 1000): void {
    this.stopEventPolling();

    this.eventPollingInterval = setInterval(() => {
      this.pollForEvents();
    }, intervalMs);

    console.log(`🔄 Event polling démarré (${intervalMs}ms)`);
  }

  public stopEventPolling(): void {
    if (this.eventPollingInterval) {
      clearInterval(this.eventPollingInterval);
      this.eventPollingInterval = undefined;
      console.log("⏹️ Event polling arrêté");
    }
  }

  private async pollForEvents(): Promise<void> {
    if (!this.queryClient) return;

    try {
      // Cette logique sera implémentée avec le hook correspondant
      // qui utilisera getRoomUpdates pour récupérer les nouveaux événements
    } catch (error) {
      console.error("❌ Erreur polling événements:", error);
    }
  }

  // ========== UTILITAIRES ==========

  public isLocalPlayer(playerUsername: string): boolean {
    return playerUsername === this.config.currentUserId;
  }

  public getLocalPlayer(): PlayerEntity | null {
    return (
      this.getState().players.find(
        (p) => p.username === this.config.currentUserId,
      ) ?? null
    );
  }

  public isMyTurn(): boolean {
    return this.getState().playerTurnUsername === this.config.currentUserId;
  }

  public getConfig(): MultiplayerGameConfig {
    return { ...this.config };
  }

  // ========== CLEANUP ==========

  public destroy(): void {
    this.stopEventPolling();
    this.pendingActions = [];
    // Note: listeners est géré par la classe de base
  }

  // ========== UTILITAIRES ==========

  private sendPeriodicStateSync(): void {
    // Envoyer un sync d'état toutes les 30 secondes si on est l'hôte
    const now = Date.now();
    const lastSync = (this as any).lastStateSyncTime ?? 0;

    if (now - lastSync > 30000) {
      // 30 secondes
      this.sendGameEvent("GAME_STATE_UPDATE", {
        gameState: this.getState(),
      });
      (this as any).lastStateSyncTime = now;
    }
  }
}
