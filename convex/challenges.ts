import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getMinimumBalance } from "./currencies";
import { currencyValidator } from "./validators";

const CHALLENGE_EXPIRY_HOURS = 24;

export const sendChallenge = mutation({
  args: {
    challengerId: v.id("users"),
    challengedId: v.id("users"),
    mode: v.union(v.literal("RANKED"), v.literal("CASH")),
    betAmount: v.optional(v.number()),
    currency: v.optional(currencyValidator),
    competitive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (args.challengerId === args.challengedId) {
      throw new Error("Vous ne pouvez pas vous défier vous-même.");
    }

    const challenger = await ctx.db.get(args.challengerId);
    const challenged = await ctx.db.get(args.challengedId);

    if (!challenger || !challenged) {
      throw new Error("Utilisateur non trouvé.");
    }

    if (!challenged.onboardingCompleted) {
      throw new Error("L'utilisateur n'a pas terminé son onboarding.");
    }

    // Vérifier qu'il n'y a pas déjà un défi en attente
    const existingChallenge = await ctx.db
      .query("challenges")
      .withIndex("by_challenger", (q) =>
        q.eq("challengerId", args.challengerId)
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("challengedId"), args.challengedId),
          q.eq(q.field("status"), "pending")
        )
      )
      .first();

    if (existingChallenge) {
      throw new Error("Vous avez déjà envoyé un défi à cet utilisateur.");
    }

    // Vérifier le solde pour les parties cash
    if (args.mode === "CASH" && args.betAmount) {
      const challengerBalance = challenger.balance || 0;
      const minimumRequired = getMinimumBalance(args.betAmount);

      if (challengerBalance < minimumRequired) {
        throw new Error(
          `Solde insuffisant. Vous devez avoir au moins ${minimumRequired} ${args.currency || "XAF"} (3× la mise).`
        );
      }
    }

    const now = Date.now();
    const expiresAt = now + CHALLENGE_EXPIRY_HOURS * 60 * 60 * 1000;

    const challengeId = await ctx.db.insert("challenges", {
      challengerId: args.challengerId,
      challengedId: args.challengedId,
      mode: args.mode,
      betAmount: args.betAmount,
      currency: args.currency,
      competitive: args.competitive !== undefined ? args.competitive : true,
      status: "pending",
      createdAt: now,
      expiresAt,
    });

    // TODO: Envoyer une notification push au destinataire

    return { challengeId, success: true };
  },
});

export const acceptChallenge = mutation({
  args: {
    challengeId: v.id("challenges"),
    userId: v.id("users"), // L'utilisateur qui accepte
  },
  handler: async (ctx, args) => {
    const challenge = await ctx.db.get(args.challengeId);

    if (!challenge) {
      throw new Error("Défi non trouvé.");
    }

    if (challenge.challengedId !== args.userId) {
      throw new Error("Vous n'êtes pas autorisé à accepter ce défi.");
    }

    if (challenge.status !== "pending") {
      throw new Error("Ce défi n'est plus valide.");
    }

    const now = Date.now();
    if (now > challenge.expiresAt) {
      await ctx.db.patch(challenge._id, { status: "expired" });
      throw new Error("Ce défi a expiré.");
    }

    const challenger = await ctx.db.get(challenge.challengerId);
    const challenged = await ctx.db.get(challenge.challengedId);

    if (!challenger || !challenged) {
      throw new Error("Utilisateur non trouvé.");
    }

    // Vérifier le solde pour les parties cash
    if (challenge.mode === "CASH" && challenge.betAmount) {
      const challengerBalance = challenger.balance || 0;
      const challengedBalance = challenged.balance || 0;
      const minimumRequired = getMinimumBalance(challenge.betAmount);

      if (
        challengerBalance < minimumRequired ||
        challengedBalance < minimumRequired
      ) {
        throw new Error(
          `Solde insuffisant. Les deux joueurs doivent avoir au moins ${minimumRequired} ${challenge.currency || "XAF"}.`
        );
      }
    }

    // Créer la partie via matchmaking
    const betAmount = challenge.betAmount || 0;
    const currency = challenge.currency || challenged.currency || "XAF";

    // Utiliser l'API matchmaking pour créer la partie directement
    // Pour l'instant, on va créer la partie manuellement
    const seed = crypto.randomUUID();
    const gameId = `game-${seed}`;

    const players: any[] = [
      {
        userId: challenge.challengerId,
        username: challenger.username,
        type: "user",
        isConnected: true,
        avatar: challenger.avatarUrl,
        balance: 0,
      },
      {
        userId: challenge.challengedId,
        username: challenged.username,
        type: "user",
        isConnected: true,
        avatar: challenged.avatarUrl,
        balance: 0,
      },
    ];

    // Déduire les mises si c'est une partie cash
    if (betAmount > 0) {
      await ctx.db.patch(challenge.challengerId, {
        balance: (challenger.balance || 0) - betAmount,
      });
      await ctx.db.patch(challenge.challengedId, {
        balance: (challenged.balance || 0) - betAmount,
      });

      await ctx.db.insert("transactions", {
        userId: challenge.challengerId,
        type: "bet",
        amount: -betAmount,
        currency,
        gameId,
        description: `Mise de ${betAmount} ${currency} pour le défi`,
        createdAt: now,
      });

      await ctx.db.insert("transactions", {
        userId: challenge.challengedId,
        type: "bet",
        amount: -betAmount,
        currency,
        gameId,
        description: `Mise de ${betAmount} ${currency} pour le défi`,
        createdAt: now,
      });
    }

    const gameData = {
      gameId,
      seed,
      version: 1,
      status: "WAITING" as const,
      currentRound: 1,
      maxRounds: 5,
      hasHandPlayerId: null as any,
      currentTurnPlayerId: null as any,
      players,
      playedCards: [],
      bet: {
        amount: betAmount,
        currency,
      },
      winnerId: null as any,
      endReason: null as string | null,
      history: [
        {
          action: "game_created" as const,
          timestamp: now,
          playerId: challenge.challengerId,
          data: {
            message: `Partie créée par défi entre ${challenger.username} et ${challenged.username}`,
          },
        },
      ],
      mode:
        challenge.mode === "RANKED" ? ("RANKED" as const) : ("CASH" as const),
      competitive:
        challenge.competitive !== undefined ? challenge.competitive : true,
      maxPlayers: 2,
      aiDifficulty: null as string | null,
      roomName: undefined,
      isPrivate: false,
      hostId: challenge.challengerId,
      joinCode: undefined,
      startedAt: now,
      endedAt: null as number | null,
      lastUpdatedAt: now,
      victoryType: null as string | null,
      rematchGameId: undefined,
      timerEnabled: true, // Timer activé par défaut pour les défis
      timerDuration: 60,
      playerTimers: [
        {
          playerId: challenge.challengerId,
          timeRemaining: 60,
          lastUpdated: now,
        },
        {
          playerId: challenge.challengedId,
          timeRemaining: 60,
          lastUpdated: now,
        },
      ],
    };

    await ctx.db.insert("games", gameData as any);

    // Marquer le défi comme accepté
    await ctx.db.patch(challenge._id, {
      status: "accepted",
      respondedAt: now,
      gameId,
    });

    // TODO: Envoyer une notification push au challenger

    return { gameId, success: true };
  },
});

export const rejectChallenge = mutation({
  args: {
    challengeId: v.id("challenges"),
    userId: v.id("users"), // L'utilisateur qui rejette
  },
  handler: async (ctx, args) => {
    const challenge = await ctx.db.get(args.challengeId);

    if (!challenge) {
      throw new Error("Défi non trouvé.");
    }

    if (challenge.challengedId !== args.userId) {
      throw new Error("Vous n'êtes pas autorisé à rejeter ce défi.");
    }

    if (challenge.status !== "pending") {
      throw new Error("Ce défi n'est plus valide.");
    }

    await ctx.db.patch(challenge._id, {
      status: "rejected",
      respondedAt: Date.now(),
    });

    return { success: true };
  },
});

export const getPendingChallenges = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const challenges = await ctx.db
      .query("challenges")
      .withIndex("by_challenged", (q) => q.eq("challengedId", args.userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    const now = Date.now();
    // Filtrer les défis expirés (on ne peut pas modifier dans une query)
    const validChallenges = challenges.filter((c) => c.expiresAt > now);

    const challengesWithChallenger = await Promise.all(
      validChallenges.map(async (challenge) => {
        const challenger = await ctx.db.get(challenge.challengerId);
        return {
          _id: challenge._id,
          challenger:
            challenger ?
              {
                _id: challenger._id,
                username: challenger.username,
                avatarUrl: challenger.avatarUrl,
                pr: challenger.pr,
              }
            : null,
          mode: challenge.mode,
          betAmount: challenge.betAmount,
          currency: challenge.currency,
          competitive: challenge.competitive,
          createdAt: challenge.createdAt,
          expiresAt: challenge.expiresAt,
        };
      })
    );

    return challengesWithChallenger;
  },
});

export const getSentChallenges = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const challenges = await ctx.db
      .query("challenges")
      .withIndex("by_challenger", (q) => q.eq("challengerId", args.userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    const challengesWithChallenged = await Promise.all(
      challenges.map(async (challenge) => {
        const challenged = await ctx.db.get(challenge.challengedId);
        return {
          _id: challenge._id,
          challenged:
            challenged ?
              {
                _id: challenged._id,
                username: challenged.username,
                avatarUrl: challenged.avatarUrl,
                pr: challenged.pr,
              }
            : null,
          mode: challenge.mode,
          betAmount: challenge.betAmount,
          currency: challenge.currency,
          competitive: challenge.competitive,
          createdAt: challenge.createdAt,
          expiresAt: challenge.expiresAt,
        };
      })
    );

    return challengesWithChallenged;
  },
});
