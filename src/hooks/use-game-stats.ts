"use client";

import { api } from "@/trpc/react";

export function useGameStats() {
  const statsQuery = api.game.getStats.useQuery();
  const historyQuery = api.game.getHistory.useQuery();
  const updateStatsMutation = api.game.updateStats.useMutation();

  return {
    // Données
    stats: statsQuery.data,
    history: historyQuery.data ?? [],

    // État des requêtes
    isLoading: statsQuery.isLoading ?? historyQuery.isLoading,
    isError: statsQuery.isError ?? historyQuery.isError,
    error: statsQuery.error ?? historyQuery.error,

    // Actions
    updateStats: updateStatsMutation.mutate,
    refetch: () => {
      void statsQuery.refetch();
      void historyQuery.refetch();
    },

    // Statistiques calculées
    winRate: statsQuery.data?.totalGames
      ? Math.round((statsQuery.data.wins / statsQuery.data.totalGames) * 100)
      : 0,

    totalKorasBalance: statsQuery.data
      ? statsQuery.data.totalKorasWon - statsQuery.data.totalKorasLost
      : 0,
  };
}
