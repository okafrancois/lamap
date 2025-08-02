"use client";

import { useState, useCallback } from "react";
import { api } from "@/trpc/react";
import { useKoraEngine } from "@/hooks/use-kora-engine";
import { useUserDataContext } from "@/components/layout/user-provider";
import {
  type PlayerEntity,
  type AIDifficulty,
} from "@/engine/kora-game-engine";

export function useGameResume() {
  const koraEngine = useKoraEngine();
  const userData = useUserDataContext();
  const [isLoading, setIsLoading] = useState(false);
  const utils = api.useUtils();

  // Récupérer les parties en cours
  const ongoingGamesQuery = api.game.getOngoingGames.useQuery();

  // Fonction pour reprendre une partie
  const resumeGame = useCallback(
    async (gameId: string) => {
      if (!userData) return false;

      setIsLoading(true);
      try {
        // Récupérer les détails de la partie avec utils.client
        const serverGame = await utils.client.game.getGame.query({ gameId });

        // Reconstruire les joueurs à partir des données
        const players: PlayerEntity[] = [
          {
            username: userData.user.username,
            type: "user",
            isConnected: true,
            name: userData.user.name || userData.user.username,
            koras: 100, // Valeur par défaut, sera mise à jour
          },
        ];

        // Ajouter l'adversaire
        if (serverGame.mode === "ai") {
          players.push({
            username: "ai-opponent",
            type: "ai",
            isConnected: true,
            name: "IA",
            koras: 100,
            aiDifficulty: (serverGame.aiDifficulty as AIDifficulty) || "medium",
          });
        } else if (serverGame.players[1]) {
          players.push({
            username: serverGame.players[1].username,
            type: "user",
            isConnected: true,
            name: serverGame.players[1].name || serverGame.players[1].username,
            koras: 100,
          });
        }

        // Initialiser le moteur avec les données existantes
        koraEngine.initializeEngine(
          serverGame.currentBet,
          serverGame.maxRounds,
          players,
        );

        // TODO: Restaurer l'état complet de la partie
        // Pour l'instant, on démarre une nouvelle partie avec les mêmes paramètres
        // Il faudrait reconstruire l'état exact (cartes, tours joués, etc.)

        console.log("Partie reprise:", serverGame);
        return true;
      } catch (error) {
        console.error("Erreur lors de la reprise de partie:", error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [userData, koraEngine, utils.client],
  );

  return {
    // Données
    ongoingGames: ongoingGamesQuery.data || [],
    isLoadingGames: ongoingGamesQuery.isLoading,

    // Actions
    resumeGame,
    isResuming: isLoading,

    // Refresh
    refetch: ongoingGamesQuery.refetch,
  };
}
