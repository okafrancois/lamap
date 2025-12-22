import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrencyFromCountry } from "./currencies";

export const checkUsernameAvailability = query({
  args: {
    username: v.string(),
    currentUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const normalizedUsername = args.username.toLowerCase().trim();

    if (normalizedUsername.length < 3) {
      return {
        available: false,
        message: "Le nom d'utilisateur doit contenir au moins 3 caractères",
      };
    }

    if (normalizedUsername.length > 20) {
      return {
        available: false,
        message: "Le nom d'utilisateur ne peut pas dépasser 20 caractères",
      };
    }

    if (!/^[a-z0-9_-]+$/.test(normalizedUsername)) {
      return {
        available: false,
        message:
          "Seuls les lettres, chiffres, tirets et underscores sont autorisés",
      };
    }

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", normalizedUsername))
      .first();

    if (existingUser && existingUser._id !== args.currentUserId) {
      return {
        available: false,
        message: "Ce nom d'utilisateur est déjà pris",
      };
    }

    return { available: true, message: "Ce nom d'utilisateur est disponible" };
  },
});

export const setUsername = mutation({
  args: {
    userId: v.id("users"),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    const normalizedUsername = args.username.toLowerCase().trim();

    const availability = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", normalizedUsername))
      .first();

    if (availability && availability._id !== args.userId) {
      throw new Error("Ce nom d'utilisateur est déjà pris");
    }

    await ctx.db.patch(args.userId, {
      username: normalizedUsername,
    });

    return { success: true };
  },
});

export const setCountry = mutation({
  args: {
    userId: v.id("users"),
    countryCode: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    const currency = getCurrencyFromCountry(args.countryCode);

    await ctx.db.patch(args.userId, {
      country: args.countryCode,
      currency: currency,
    });

    return { success: true, currency };
  },
});

export const completeOnboarding = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    await ctx.db.patch(args.userId, {
      onboardingCompleted: true,
    });

    return { success: true };
  },
});

export const completeTutorial = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    const TUTORIAL_REWARD = 500;
    const currentKora = user.kora || 0;

    await ctx.db.patch(args.userId, {
      tutorialCompleted: true,
      onboardingCompleted: true,
      kora: currentKora + TUTORIAL_REWARD,
    });

    await ctx.db.insert("transactions", {
      userId: args.userId,
      type: "tutorial_reward",
      amount: TUTORIAL_REWARD,
      currency: user.currency || "XAF",
      description: "Récompense tutoriel",
      createdAt: Date.now(),
    });

    return { success: true, koraReward: TUTORIAL_REWARD };
  },
});

export const getOnboardingStatus = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    return {
      onboardingCompleted: user.onboardingCompleted || false,
      tutorialCompleted: user.tutorialCompleted || false,
      hasUsername: !!user.username && user.username.length > 0,
      hasCountry: !!user.country,
      hasCurrency: !!user.currency,
    };
  },
});
