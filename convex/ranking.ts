import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

// ========== CONSTANTES DE RANKING ==========

export type RankTier =
  | "BRONZE"
  | "SILVER"
  | "GOLD"
  | "PLATINUM"
  | "DIAMOND"
  | "MASTER"
  | "LEGEND";

export interface RankInfo {
  tier: RankTier;
  name: string;
  minPR: number;
  maxPR: number;
  color: string;
  icon: string;
  koraReward: number; // Kora gagnés lors de la première montée à ce rang
}

export const RANK_TIERS: Record<RankTier, RankInfo> = {
  BRONZE: {
    tier: "BRONZE",
    name: "Bronze",
    minPR: 0,
    maxPR: 999,
    color: "#CD7F32",
    icon: "🥉",
    koraReward: 0,
  },
  SILVER: {
    tier: "SILVER",
    name: "Argent",
    minPR: 1000,
    maxPR: 1199,
    color: "#C0C0C0",
    icon: "🥈",
    koraReward: 500,
  },
  GOLD: {
    tier: "GOLD",
    name: "Or",
    minPR: 1200,
    maxPR: 1399,
    color: "#FFD700",
    icon: "🥇",
    koraReward: 1000,
  },
  PLATINUM: {
    tier: "PLATINUM",
    name: "Platine",
    minPR: 1400,
    maxPR: 1599,
    color: "#E5E4E2",
    icon: "💎",
    koraReward: 2000,
  },
  DIAMOND: {
    tier: "DIAMOND",
    name: "Diamant",
    minPR: 1600,
    maxPR: 1799,
    color: "#B9F2FF",
    icon: "💠",
    koraReward: 5000,
  },
  MASTER: {
    tier: "MASTER",
    name: "Maître",
    minPR: 1800,
    maxPR: 1999,
    color: "#9B59B6",
    icon: "👑",
    koraReward: 10000,
  },
  LEGEND: {
    tier: "LEGEND",
    name: "Légende",
    minPR: 2000,
    maxPR: Infinity,
    color: "#E74C3C",
    icon: "⭐",
    koraReward: 20000,
  },
};

// PR de départ pour les nouveaux joueurs
export const INITIAL_PR = 1000;

// Constantes pour le calcul de PR
export const K_FACTOR = 32; // Facteur K standard (peut être ajusté)
export const MIN_PR = 0; // PR minimum (on ne peut pas descendre en dessous)

// ========== FONCTIONS UTILITAIRES ==========

/**
 * Détermine le palier de rang en fonction des PR
 */
export function getRankFromPR(pr: number): RankInfo {
  if (pr < 1000) return RANK_TIERS.BRONZE;
  if (pr < 1200) return RANK_TIERS.SILVER;
  if (pr < 1400) return RANK_TIERS.GOLD;
  if (pr < 1600) return RANK_TIERS.PLATINUM;
  if (pr < 1800) return RANK_TIERS.DIAMOND;
  if (pr < 2000) return RANK_TIERS.MASTER;
  return RANK_TIERS.LEGEND;
}

/**
 * Calcule la probabilité de victoire attendue (formule ELO)
 */
function getExpectedScore(playerPR: number, opponentPR: number): number {
  return 1 / (1 + Math.pow(10, (opponentPR - playerPR) / 400));
}

/**
 * Calcule le changement de PR après une partie
 * @param playerPR PR actuel du joueur
 * @param opponentPR PR de l'adversaire
 * @param actualScore 1 pour victoire, 0 pour défaite
 * @returns Changement de PR (peut être négatif)
 */
export function calculatePRChange(
  playerPR: number,
  opponentPR: number,
  actualScore: number // 1 = victoire, 0 = défaite
): number {
  const expectedScore = getExpectedScore(playerPR, opponentPR);
  const change = Math.round(K_FACTOR * (actualScore - expectedScore));
  return change;
}

/**
 * Applique un changement de PR en respectant les limites
 */
export function applyPRChange(currentPR: number, change: number): number {
  const newPR = currentPR + change;
  return Math.max(MIN_PR, newPR); // Ne peut pas descendre en dessous de MIN_PR
}

/**
 * Vérifie si un joueur a changé de rang
 */
export function hasRankChanged(oldPR: number, newPR: number): boolean {
  const oldRank = getRankFromPR(oldPR);
  const newRank = getRankFromPR(newPR);
  return oldRank.tier !== newRank.tier;
}

/**
 * Vérifie si c'est une montée de rang (et non une descente)
 */
export function isRankUp(oldPR: number, newPR: number): boolean {
  if (!hasRankChanged(oldPR, newPR)) return false;
  return newPR > oldPR;
}

// ========== QUERIES ==========

/**
 * Récupère les informations de rang d'un joueur
 */
export const getUserRank = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const pr = user.pr || INITIAL_PR;
    const rank = getRankFromPR(pr);

    return {
      pr,
      rank,
      progress:
        rank.maxPR === Infinity ?
          100
        : ((pr - rank.minPR) / (rank.maxPR - rank.minPR)) * 100,
    };
  },
});

/**
 * Récupère le classement global (top 100)
 */
export const getGlobalLeaderboard = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;

    const users = await ctx.db.query("users").order("desc").collect();

    // Trier par PR décroissant
    const sortedUsers = users
      .filter((u) => u.pr !== undefined)
      .sort((a, b) => (b.pr || 0) - (a.pr || 0))
      .slice(0, limit);

    return sortedUsers.map((user, index) => ({
      position: index + 1,
      userId: user._id,
      username: user.username,
      pr: user.pr || INITIAL_PR,
      rank: getRankFromPR(user.pr || INITIAL_PR),
    }));
  },
});

// ========== MUTATIONS ==========

/**
 * Met à jour le PR d'un joueur après une partie classée (internal pour être appelée depuis games.ts)
 */
export const updatePlayerPRInternal = internalMutation({
  args: {
    playerId: v.id("users"),
    opponentId: v.id("users"),
    playerWon: v.boolean(),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    const opponent = await ctx.db.get(args.opponentId);

    if (!player || !opponent) {
      throw new Error("Joueur non trouvé");
    }

    const playerPR = player.pr || INITIAL_PR;
    const opponentPR = opponent.pr || INITIAL_PR;

    // Calculer le changement de PR
    const prChange = calculatePRChange(
      playerPR,
      opponentPR,
      args.playerWon ? 1 : 0
    );
    const newPR = applyPRChange(playerPR, prChange);

    // Vérifier si c'est une montée de rang
    const rankUp = isRankUp(playerPR, newPR);
    let koraReward = 0;

    if (rankUp) {
      const newRank = getRankFromPR(newPR);

      // Vérifier si c'est la première fois que le joueur atteint ce rang
      const rankHistory = player.rankHistory || [];
      const hasReachedBefore = rankHistory.includes(newRank.tier);

      if (!hasReachedBefore) {
        koraReward = newRank.koraReward;

        // Ajouter les Kora au joueur
        await ctx.db.patch(args.playerId, {
          kora: (player.kora || 0) + koraReward,
        });

        // Ajouter le rang à l'historique
        await ctx.db.patch(args.playerId, {
          rankHistory: [...rankHistory, newRank.tier],
        });
      }
    }

    // Mettre à jour le PR
    await ctx.db.patch(args.playerId, {
      pr: newPR,
    });

    // Enregistrer dans l'historique
    await ctx.db.insert("prHistory", {
      userId: args.playerId,
      oldPR: playerPR,
      newPR,
      change: prChange,
      opponentId: args.opponentId,
      opponentPR,
      won: args.playerWon,
      timestamp: Date.now(),
    });

    return {
      oldPR: playerPR,
      newPR,
      prChange,
      rankUp,
      koraReward,
      newRank: rankUp ? getRankFromPR(newPR) : null,
    };
  },
});

/**
 * Initialise le PR d'un joueur (appelé lors de la création du compte)
 */
export const initializePlayerPR = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    await ctx.db.patch(args.userId, {
      pr: INITIAL_PR,
      rankHistory: ["SILVER"], // Commence en Argent (PR 1000)
    });

    return { pr: INITIAL_PR };
  },
});

/**
 * Récupère l'historique des changements de PR d'un joueur
 */
export const getPRHistory = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    const history = await ctx.db
      .query("prHistory")
      .withIndex("by_user_timestamp", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    // Enrichir avec les infos de l'adversaire
    return await Promise.all(
      history.map(async (entry) => {
        const opponent = await ctx.db.get(entry.opponentId);
        return {
          ...entry,
          opponentUsername: opponent?.username || "Joueur",
          opponentRank: getRankFromPR(entry.opponentPR),
        };
      })
    );
  },
});

/**
 * Récupère les statistiques de PR d'un joueur
 */
export const getPRStats = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const currentPR = user.pr || INITIAL_PR;
    const currentRank = getRankFromPR(currentPR);

    // Récupérer l'historique complet
    const history = await ctx.db
      .query("prHistory")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const totalGames = history.length;
    const wins = history.filter((h) => h.won).length;
    const losses = totalGames - wins;
    const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;

    // PR max et min
    const maxPR =
      history.length > 0 ? Math.max(...history.map((h) => h.newPR)) : currentPR;
    const minPR =
      history.length > 0 ? Math.min(...history.map((h) => h.newPR)) : currentPR;

    // Total PR gagné/perdu
    const totalPRGained = history
      .filter((h) => h.change > 0)
      .reduce((sum, h) => sum + h.change, 0);
    const totalPRLost = history
      .filter((h) => h.change < 0)
      .reduce((sum, h) => sum + Math.abs(h.change), 0);

    // Série actuelle (win/loss streak)
    let currentStreak = 0;
    for (let i = 0; i < history.length; i++) {
      if (i === 0) {
        currentStreak = history[i].won ? 1 : -1;
      } else if (
        (history[i].won && currentStreak > 0) ||
        (!history[i].won && currentStreak < 0)
      ) {
        currentStreak += history[i].won ? 1 : -1;
      } else {
        break;
      }
    }

    return {
      currentPR,
      currentRank,
      totalGames,
      wins,
      losses,
      winRate: Math.round(winRate * 10) / 10,
      maxPR,
      minPR,
      totalPRGained,
      totalPRLost,
      currentStreak,
    };
  },
});
