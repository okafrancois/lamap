import { v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
  QueryCtx,
} from "./_generated/server";

// Mutations internes pour les webhooks Clerk
export const updateOrCreateUser = internalMutation({
  args: {
    clerkUser: v.any(), // Utiliser v.any() pour accepter tous les champs de l'objet Clerk
  },
  handler: async (ctx, args) => {
    const { clerkUser } = args;

    // Extraire le nom complet
    const firstName = clerkUser.first_name || "";
    const lastName = clerkUser.last_name || "";

    // Trouver l'email principal (gérer le cas où email_addresses est vide)
    const primaryEmail = clerkUser.email_addresses?.find?.(
      (email: any) => email.id === clerkUser.primary_email_address_id
    );
    const email =
      primaryEmail?.email_address ||
      clerkUser.email_addresses?.[0]?.email_address ||
      "";

    const avatarUrl =
      clerkUser.profile_image_url || clerkUser.image_url || null;

    // Vérifier si l'utilisateur existe déjà
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", clerkUser.id))
      .first();

    if (existing) {
      // Mettre à jour l'utilisateur existant
      await ctx.db.patch(existing._id, {
        firstName: firstName,
        lastName: lastName,
        email: email,
        username: clerkUser.username,
        ...(avatarUrl ? { avatarUrl } : {}),
      });
      return existing._id;
    } else {
      // Créer un nouvel utilisateur
      const newUserId = await ctx.db.insert("users", {
        firstName: firstName,
        lastName: lastName,
        email: email,
        bio: "",
        avatarUrl: avatarUrl || undefined,
        createdAt: Date.now(),
        isActive: true,
        username: clerkUser.username ?? email.split("@")[0],
        clerkUserId: clerkUser.id,
      });
      return newUserId;
    }
  },
});

export const deleteUser = internalMutation({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (user) {
      await ctx.db.delete(user._id);
    } else {
      console.log(`User not found for deletion: ${args.clerkUserId}`);
    }
  },
});

const getUserQuery = {
  args: {
    clerkUserId: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      email: v.string(),
      bio: v.optional(v.string()),
      avatarUrl: v.optional(v.string()),
      createdAt: v.number(),
      isActive: v.boolean(),
      username: v.string(),
      clerkUserId: v.string(),
      balance: v.optional(v.number()),
      currency: v.optional(v.string()),
      country: v.optional(v.string()),
      onboardingCompleted: v.optional(v.boolean()),
      tutorialCompleted: v.optional(v.boolean()),
      // Système de ranking
      pr: v.optional(v.number()),
      kora: v.optional(v.number()),
      rankHistory: v.optional(v.array(v.string())),
    }),
    v.null()
  ),
  handler: async (ctx: QueryCtx, args: { clerkUserId: string }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();
  },
};

// Query interne pour récupérer un utilisateur par son ID Clerk
export const getUser = internalQuery(getUserQuery);
export const getCurrentUser = query(getUserQuery);

// Mutation publique pour créer/mettre à jour un utilisateur (pour compatibilité)
export const createOrUpdateUser = mutation({
  args: {
    clerkId: v.string(),
    username: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", args.clerkId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        username: args.username,
        email: args.email,
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      firstName: "",
      lastName: "",
      email: args.email || "",
      bio: "",
      avatarUrl: undefined,
      createdAt: Date.now(),
      isActive: true,
      username: args.username,
      clerkUserId: args.clerkId,
      balance: 1000,
      currency: "XAF",
    });
  },
});

// Mutation to update user balance
export const updateBalance = internalMutation({
  args: {
    userId: v.id("users"),
    amount: v.number(), // Positive to add, negative to subtract
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const currentBalance = user.balance || 0;
    const newBalance = currentBalance + args.amount;

    if (newBalance < 0) {
      throw new Error("Insufficient balance");
    }

    await ctx.db.patch(args.userId, {
      balance: newBalance,
    });
  },
});

// Mutation to update user currency preference
export const updateCurrency = internalMutation({
  args: {
    userId: v.id("users"),
    currency: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(args.userId, {
      currency: args.currency,
    });
  },
});

// Query to get user balance (for display purposes)
export const getUserBalance = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.object({
    balance: v.number(),
    currency: v.string(),
  }),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    return {
      balance: user.balance || 0,
      currency: user.currency || "XAF",
    };
  },
});

export const getUserStats = query({
  args: {
    clerkUserId: v.string(),
  },
  returns: v.object({
    wins: v.number(),
    losses: v.number(),
    totalGames: v.number(),
    winRate: v.number(),
    currentStreak: v.number(),
    bestStreak: v.number(),
  }),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (!user) {
      return {
        wins: 0,
        losses: 0,
        totalGames: 0,
        winRate: 0,
        currentStreak: 0,
        bestStreak: 0,
      };
    }

    const allEndedGames = await ctx.db
      .query("games")
      .withIndex("by_status", (q) => q.eq("status", "ENDED"))
      .collect();

    const games = allEndedGames.filter((game) =>
      game.players.some((p) => p.userId === user._id)
    );

    const sortedGames = games.sort(
      (a, b) => (a.endedAt || 0) - (b.endedAt || 0)
    );

    let wins = 0;
    let losses = 0;
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    for (const game of sortedGames) {
      const isWinner = game.winnerId === user._id;

      if (isWinner) {
        wins++;
        tempStreak++;
        if (tempStreak > bestStreak) {
          bestStreak = tempStreak;
        }
      } else {
        losses++;
        tempStreak = 0;
      }
    }

    const recentGames = sortedGames.slice(-10);
    for (let i = recentGames.length - 1; i >= 0; i--) {
      const game = recentGames[i];
      if (game.winnerId === user._id) {
        currentStreak++;
      } else {
        break;
      }
    }

    const totalGames = wins + losses;
    const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;

    return {
      wins,
      losses,
      totalGames,
      winRate: Math.round(winRate * 10) / 10,
      currentStreak,
      bestStreak,
    };
  },
});
