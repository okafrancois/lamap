/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { api } from "@/trpc/react";
import { useAuth } from "@/components/providers/auth-provider";

/**
 * Hook pour récupérer et gérer les données utilisateur
 * Utilise le cache tRPC et se synchronise avec l'AuthProvider
 */
export function useUserData() {
  const { isAuthenticated } = useAuth();
  
  const query = api.auth.userData.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    ...query,
    // Refresh forcé des données
    refresh: () => query.refetch(),
    
    // Vérifications rapides
    hasKoras: (amount: number) => (query.data?.koras ?? 0) >= amount,
    isAdmin: query.data?.role === "ADMIN",
    isModerator: query.data?.role === "MODERATOR" || query.data?.role === "ADMIN",
  };
}

/**
 * Hook pour les statistiques utilisateur uniquement
 */
export function useUserStats() {
  const { data: userData } = useUserData();
  
  if (!userData) return null;
  
  const winRate = userData.totalGames > 0 
    ? (userData.totalWins / userData.totalGames) * 100 
    : 0;
    
  return {
    totalGames: userData.totalGames,
    totalWins: userData.totalWins,
    winRate: Math.round(winRate * 10) / 10, // Arrondi à 1 décimale
    koras: userData.koras,
  } as const;
} 