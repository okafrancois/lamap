import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import {
  addHistoryEntry,
  calculateKoraMultiplier,
  checkAutomaticVictory,
  createDeck,
  determineRoundWinner,
  Game,
  getAIBotId,
  getAIBotUsername,
  getKoraType,
  getPlayerId,
  updatePlayableCards,
  updatePlayerTurn,
  validatePlayCardAction,
} from "./gameEngine";
import {
  aiDifficultyValidator,
  currencyValidator,
  gameModeValidator,
} from "./validators";

// ========== QUERIES ==========

export const getGame = query({
  args: { gameId: v.string() },
  handler: async (ctx, { gameId }) => {
    return await ctx.db
      .query("games")
      .withIndex("by_game_id", (q) => q.eq("gameId", gameId))
      .first();
  },
});

export const getGameById = query({
  args: { id: v.id("games") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const getPlayerGames = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    // Games where user is host
    const hostedGames = await ctx.db
      .query("games")
      .withIndex("by_host", (q) => q.eq("hostId", userId))
      .collect();

    // Games where user is a player
    const allGames = await ctx.db.query("games").collect();
    const participantGames = allGames.filter((game) =>
      game.players.some((p) => getPlayerId(p) === userId)
    );

    return [...hostedGames, ...participantGames];
  },
});

export const getGameByJoinCode = query({
  args: { joinCode: v.string() },
  handler: async (ctx, { joinCode }) => {
    return await ctx.db
      .query("games")
      .withIndex("by_join_code", (q) => q.eq("joinCode", joinCode))
      .first();
  },
});

export const getAvailableGames = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, { userId }) => {
    // Use the index to only fetch games with status WAITING
    const waitingGames = await ctx.db
      .query("games")
      .withIndex("by_status", (q) => q.eq("status", "WAITING"))
      .collect();

    // Filter further in TypeScript for other conditions
    return waitingGames.filter((game) => {
      if (game.mode !== "ONLINE") return false;
      if (game.isPrivate) return false;
      if (game.players.length >= game.maxPlayers) return false;
      if (userId && game.players.some((p) => p.userId === userId)) return false;
      return true;
    });
  },
});

export const getOngoingUserGames = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const ongoingGames = await ctx.db
      .query("games")
      .withIndex("by_host", (q) => q.eq("hostId", userId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "PLAYING"),
          q.eq(q.field("status"), "WAITING")
        )
      )
      .collect();

    return ongoingGames.filter((game) => {
      if (game.players.some((p) => p.userId === userId)) return true;
      return false;
    });
  },
});

export const getActiveMatch = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", clerkId))
      .first();

    if (!user) {
      return null;
    }

    const runningGame = await ctx.db
      .query("games")
      .withIndex("by_status", (q) => q.eq("status", "PLAYING"))
      .collect();

    const userRunningGame = runningGame.find((game) =>
      game.players.some((p) => p.userId === user._id)
    );

    if (userRunningGame) return userRunningGame;

    const readyGame = await ctx.db
      .query("games")
      .withIndex("by_status", (q) => q.eq("status", "WAITING"))
      .collect();

    const userReadyGame = readyGame.find((game) =>
      game.players.some((p) => p.userId === user._id)
    );

    if (userReadyGame) return userReadyGame;

    return null;
  },
});

export const getMyHand = query({
  args: {
    gameId: v.string(),
    playerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_game_id", (q) => q.eq("gameId", args.gameId))
      .first();

    if (!game) {
      return [];
    }

    const player = game.players.find((p) => p.userId === args.playerId);
    return player?.hand || [];
  },
});

export const getPlaysByTurn = query({
  args: {
    gameId: v.string(),
    round: v.number(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_game_id", (q) => q.eq("gameId", args.gameId))
      .first();

    if (!game) {
      return [];
    }

    return game.playedCards.filter((pc) => pc.round === args.round);
  },
});

export const getTurnResults = query({
  args: { gameId: v.string() },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_game_id", (q) => q.eq("gameId", args.gameId))
      .first();

    if (!game) {
      return [];
    }

    return game.history
      .filter((entry) => entry.action === "round_won")
      .map((entry) => ({
        turn: entry.data?.round || 0,
        winnerId: entry.playerId || "",
        winningCard: {
          suit: entry.data?.cardSuit || "hearts",
          rank: entry.data?.cardRank || "3",
        },
      }));
  },
});

// ========== MUTATIONS ==========

export const createGame = mutation({
  args: {
    mode: gameModeValidator,
    hostId: v.id("users"),
    betAmount: v.number(),
    currency: currencyValidator,
    maxRounds: v.optional(v.number()),
    aiDifficulty: v.optional(aiDifficultyValidator),
    roomName: v.optional(v.string()),
    isPrivate: v.optional(v.boolean()),
    joinCode: v.optional(v.string()),
    maxPlayers: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const seed = crypto.randomUUID();
    const gameId = `game-${seed}`;

    // Get host user info
    const host = await ctx.db.get(args.hostId);
    if (!host) {
      throw new Error("Host user not found");
    }

    const players: any[] = [
      {
        userId: args.hostId,
        username: host.username,
        type: "user",
        isConnected: true,
        avatar: host.avatarUrl,
        balance: 0,
      },
    ];

    // Add AI player if mode is AI
    if (args.mode === "AI") {
      const difficulty = args.aiDifficulty ?? "medium";
      players.push({
        userId: null, // AI n'a pas de userId Convex
        botId: getAIBotId(difficulty), // ID standard du bot (ai-bindi, ai-ndoss, ai-bandi)
        username: getAIBotUsername(difficulty),
        type: "ai",
        isConnected: true,
        balance: 0,
        aiDifficulty: difficulty,
      });
    }

    const now = Date.now();

    const gameData = {
      gameId,
      seed,
      version: 1,
      status: "WAITING" as const,
      currentRound: 1,
      maxRounds: args.maxRounds ?? 5,
      hasHandPlayerId: null as Id<"users"> | string | null,
      currentTurnPlayerId: null as Id<"users"> | string | null,
      players,
      playedCards: [],
      bet: {
        amount: args.betAmount,
        currency: args.currency,
      },
      winnerId: null as Id<"users"> | string | null,
      endReason: null as string | null,
      history: [
        {
          action: "game_created" as const,
          timestamp: now,
          playerId: args.hostId,
          data: {
            message: `Partie créée par ${players[0].username}`,
          },
        },
      ],
      mode: args.mode,
      maxPlayers: args.maxPlayers ?? 2,
      aiDifficulty: args.mode === "AI" ? (args.aiDifficulty ?? "medium") : null,
      roomName: args.roomName,
      isPrivate: args.isPrivate ?? false,
      hostId: args.hostId,
      joinCode: args.joinCode,
      startedAt: now,
      endedAt: null as number | null,
      lastUpdatedAt: now,
      victoryType: null as string | null,
      rematchGameId: null as string | null,
    };

    const id = await ctx.db.insert("games", gameData as any);

    return { id, gameId };
  },
});

export const startGame = mutation({
  args: { gameId: v.string() },
  handler: async (ctx, { gameId }) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_game_id", (q) => q.eq("gameId", gameId))
      .first();

    if (!game) {
      throw new Error("Game not found");
    }

    if (game.status !== "WAITING") {
      return;
    }

    // Create and distribute cards
    const deck = createDeck(game.seed);
    const firstPlayerHand = deck.slice(0, 5);
    const secondPlayerHand = deck.slice(5, 10);

    // Determine starting player (use userId or bot ID)
    const startingPlayerId =
      Math.random() < 0.5 ?
        (game.players[0].userId ??
        getAIBotId(game.players[0].aiDifficulty ?? "medium"))
      : (game.players[1].userId ??
        getAIBotId(game.players[1].aiDifficulty ?? "medium"));

    // Check for automatic victory
    const autoVictory = checkAutomaticVictory(
      firstPlayerHand,
      secondPlayerHand
    );

    if (autoVictory.hasVictory && autoVictory.playerIndex !== null) {
      const winnerPlayer = game.players[autoVictory.playerIndex];
      const winnerId = getPlayerId(winnerPlayer);
      const betAmount = game.bet.amount;
      const totalBet = betAmount * 2;
      const platformFee = totalBet * 0.02;
      const winnings = totalBet - platformFee;

      const updatedPlayers = game.players.map((p, idx) => ({
        ...p,
        hand: idx === 0 ? firstPlayerHand : secondPlayerHand,
        balance:
          getPlayerId(p) === winnerId ?
            p.balance + winnings
          : p.balance - betAmount,
      }));

      // Determine victory type from reason
      let victoryType: "auto_sevens" | "auto_sum" | "auto_lowest" | null = null;
      if (autoVictory.reason) {
        if (
          autoVictory.reason.includes("cartes de 7") ||
          autoVictory.reason.includes("7")
        ) {
          victoryType = "auto_sevens";
        } else if (autoVictory.reason.includes("Somme la plus faible")) {
          victoryType = "auto_lowest";
        } else if (autoVictory.reason.includes("Somme < 21")) {
          victoryType = "auto_sum";
        }
      }

      // Credit winnings to winner (only if human player)
      if (winnerPlayer?.userId) {
        const winner = await ctx.db.get(winnerPlayer.userId);
        if (winner) {
          await ctx.db.patch(winnerPlayer.userId, {
            balance: (winner.balance || 0) + winnings,
          });
          await ctx.db.insert("transactions", {
            userId: winnerPlayer.userId,
            type: "win",
            amount: winnings,
            currency: game.bet.currency,
            gameId: game.gameId,
            description: `Gain de ${winnings} ${game.bet.currency} (victoire automatique)`,
            createdAt: Date.now(),
          });
        }
      }

      await ctx.db.patch(game._id, {
        status: "ENDED" as const,
        players: updatedPlayers,
        winnerId: winnerId,
        endReason: autoVictory.reason,
        victoryType: victoryType,
        history: [
          ...game.history,
          {
            action: "game_started" as const,
            timestamp: Date.now(),
            data: { message: "Partie commencée" },
          },
          {
            action: "game_ended" as const,
            timestamp: Date.now(),
            playerId: winnerId,
            data: {
              message: `Victoire automatique ! ${autoVictory.reason}`,
              winnerId,
            },
          },
        ],
        version: game.version + 2,
        lastUpdatedAt: Date.now(),
        endedAt: Date.now(),
      } as any);

      return { gameId, winnerId, autoVictory: true };
    }

    // Normal game start
    const updatedPlayers = game.players.map((p) => {
      const playerId = p.userId ?? getAIBotId(p.aiDifficulty ?? "medium");
      return {
        ...p,
        hand:
          playerId === startingPlayerId ? firstPlayerHand : secondPlayerHand,
      };
    });

    let gameState: Game = {
      ...game,
      status: "PLAYING" as const,
      currentRound: 1,
      hasHandPlayerId: startingPlayerId,
      currentTurnPlayerId: startingPlayerId,
      players: updatedPlayers,
      history: [
        ...game.history,
        {
          action: "game_started" as const,
          timestamp: Date.now(),
          data: {
            message: `Partie commencée ! ${game.players.find((p) => getPlayerId(p) === startingPlayerId)?.username} a la main`,
          },
        },
      ],
      version: game.version + 1,
      lastUpdatedAt: Date.now(),
    } as Game;

    gameState = updatePlayableCards(gameState);

    await ctx.db.patch(game._id, gameState as any);

    // Trigger AI if needed
    if (game.mode === "AI") {
      const aiPlayer = gameState.players.find((p) => p.type === "ai");
      if (aiPlayer && gameState.currentTurnPlayerId === getPlayerId(aiPlayer)) {
        await ctx.scheduler.runAfter(1000, internal.games.triggerAITurn, {
          gameId,
        });
      }
    }

    return { gameId, startingPlayerId };
  },
});

export const playCard = mutation({
  args: {
    gameId: v.string(),
    cardId: v.string(),
    playerId: v.union(v.id("users"), v.string()), // Peut être userId ou bot ID
  },
  handler: async (ctx, { gameId, cardId, playerId }) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_game_id", (q) => q.eq("gameId", gameId))
      .first();

    if (!game) {
      throw new Error("Game not found");
    }

    // Validate the play
    const validation = validatePlayCardAction(cardId, playerId, game);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const player = game.players.find((p) => getPlayerId(p) === playerId)!;
    const card = player.hand?.find((c) => c.id === cardId);
    if (!card) {
      throw new Error("Card not found");
    }

    // Play the card
    const newPlayedCards = [
      ...game.playedCards,
      {
        card,
        playerId,
        round: game.currentRound,
        timestamp: Date.now(),
      },
    ];

    // Remove card from player's hand
    const updatedPlayers = game.players.map((p) =>
      getPlayerId(p) === playerId ?
        { ...p, hand: p.hand?.filter((c) => c.id !== cardId) }
      : p
    );

    let gameState: Game = {
      ...game,
      players: updatedPlayers,
      playedCards: newPlayedCards,
    } as Game;

    // Add card played to history
    gameState = addHistoryEntry(gameState, "card_played", playerId, {
      message: `${player.username} a joué ${card.rank} de ${card.suit}`,
      cardId: card.id,
      cardSuit: card.suit,
      cardRank: card.rank,
      round: game.currentRound,
    });

    // Check if round is complete
    const currentRoundCards = newPlayedCards.filter(
      (p) => p.round === game.currentRound
    );

    if (currentRoundCards.length === 2) {
      // Resolve round
      const firstCard = currentRoundCards[0];
      const secondCard = currentRoundCards[1];

      if (!firstCard || !secondCard) {
        throw new Error("Invalid round cards");
      }

      const winnerId = determineRoundWinner(
        firstCard,
        secondCard,
        game.hasHandPlayerId ?? ""
      );

      gameState.hasHandPlayerId = winnerId;

      // Add round won to history
      const winnerName = gameState.players.find(
        (p) => getPlayerId(p) === winnerId
      )?.username;
      gameState = addHistoryEntry(gameState, "round_won", winnerId, {
        message: `${winnerName} remporte le tour ${game.currentRound}`,
        winnerId,
        round: game.currentRound,
      });
      gameState.version = gameState.version + 1;
      gameState.lastUpdatedAt = Date.now();

      // Check for Kora on round 5
      if (game.currentRound === 5) {
        const winnerCard = currentRoundCards.find(
          (rc) => rc.playerId === winnerId
        )?.card;

        if (winnerCard && winnerCard.rank === "3") {
          const rounds3to5 = [3, 4, 5].map((round) => {
            const roundCards = game.playedCards.filter(
              (pc) => pc.round === round && pc.playerId === winnerId
            );
            return roundCards.length > 0 && roundCards[0].card.rank === "3" ?
                1
              : 0;
          });

          let consecutiveThrees = 0;
          if (
            rounds3to5[0] === 1 &&
            rounds3to5[1] === 1 &&
            rounds3to5[2] === 1
          ) {
            consecutiveThrees = 3;
          } else if (rounds3to5[1] === 1 && rounds3to5[2] === 1) {
            consecutiveThrees = 2;
          } else if (rounds3to5[2] === 1) {
            consecutiveThrees = 1;
          }

          const multiplier = calculateKoraMultiplier(consecutiveThrees);
          const koraType = getKoraType(consecutiveThrees);
          const betAmount = game.bet.amount;
          const totalBet = betAmount * 2;
          const platformFee = totalBet * 0.02;
          const korasWon = (totalBet - platformFee) * multiplier;

          gameState.players = gameState.players.map((p) => ({
            ...p,
            balance:
              getPlayerId(p) === winnerId ?
                p.balance + korasWon
              : p.balance - betAmount,
          }));

          // Credit winnings to winner (only if human player)
          const winnerPlayer = gameState.players.find(
            (p) => getPlayerId(p) === winnerId
          );
          if (winnerPlayer?.userId) {
            const winner = await ctx.db.get(winnerPlayer.userId);
            if (winner) {
              await ctx.db.patch(winnerPlayer.userId, {
                balance: (winner.balance || 0) + korasWon,
              });
              await ctx.db.insert("transactions", {
                userId: winnerPlayer.userId,
                type: "win",
                amount: korasWon,
            currency: game.bet.currency,
                gameId: game.gameId,
                description: `Gain de ${korasWon} ${game.bet.currency} (${koraType})`,
                createdAt: Date.now(),
              });
            }
          }

          gameState = addHistoryEntry(gameState, "kora_achieved", winnerId, {
            message: `🎯 ${koraType} ! Multiplicateur x${multiplier} !`,
            koraType,
            multiplier,
            winnerId,
          });
          gameState.victoryType = koraType as
            | "normal"
            | "simple_kora"
            | "double_kora"
            | "triple_kora";
          gameState.version = gameState.version + 1;
          gameState.lastUpdatedAt = Date.now();
        }
      }

      // Check if game should end
      const anyPlayerOutOfCards = gameState.players.some(
        (p) => p.hand?.length === 0
      );
      if (game.currentRound >= 5 || anyPlayerOutOfCards) {
        // End game
        const betAmount = game.bet.amount;
        const totalBet = betAmount * 2;
        const platformFee = totalBet * 0.02;
        const winnings = totalBet - platformFee;

        gameState.status = "ENDED" as const;
        gameState.winnerId = winnerId;
        gameState.endedAt = Date.now();
        if (!gameState.victoryType) {
          gameState.victoryType = "normal";
        }

        const winnerPlayer = gameState.players.find(
          (p) => getPlayerId(p) === winnerId
        );

        // Update balances and create transactions
        gameState.players = gameState.players.map((p) => ({
          ...p,
          balance:
            getPlayerId(p) === winnerId ?
              p.balance + winnings
            : p.balance - betAmount,
        }));

        // Credit winnings to winner (only if human player)
        if (winnerPlayer?.userId) {
          const winner = await ctx.db.get(winnerPlayer.userId);
          if (winner) {
            await ctx.db.patch(winnerPlayer.userId, {
              balance: (winner.balance || 0) + winnings,
            });
            await ctx.db.insert("transactions", {
              userId: winnerPlayer.userId,
              type: "win",
              amount: winnings,
              currency: game.bet.currency,
              gameId: game.gameId,
              description: `Gain de ${winnings} ${game.bet.currency}`,
              createdAt: Date.now(),
            });
          }
        }

        const winnerName = gameState.players.find(
          (p) => getPlayerId(p) === winnerId
        )?.username;
        gameState = addHistoryEntry(gameState, "game_ended", winnerId, {
          message: `🏆 ${winnerName} remporte la partie !`,
          winnerId,
        });
        gameState.version = gameState.version + 1;
        gameState.lastUpdatedAt = Date.now();
      } else {
        // Next round
        gameState.currentRound++;
      }
    }

    // Update player turn
    gameState.currentTurnPlayerId = updatePlayerTurn(gameState);
    gameState = updatePlayableCards(gameState);

    await ctx.db.patch(game._id, gameState as any);

    // Trigger AI if needed
    if (game.mode === "AI" && gameState.status === "PLAYING") {
      const aiPlayer = gameState.players.find((p) => p.type === "ai");
      if (aiPlayer && gameState.currentTurnPlayerId === getPlayerId(aiPlayer)) {
        await ctx.scheduler.runAfter(1000, internal.games.triggerAITurn, {
          gameId,
        });
      }
    }

    return { success: true, gameState };
  },
});

// ========== AI LOGIC ==========

export const triggerAITurn = internalMutation({
  args: { gameId: v.string() },
  handler: async (ctx, { gameId }) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_game_id", (q) => q.eq("gameId", gameId))
      .first();

    if (!game) return;
    if (game.status !== "PLAYING") return;

    const aiPlayer = game.players.find((p) => p.type === "ai");
    if (!aiPlayer) return;
    if (game.currentTurnPlayerId !== getPlayerId(aiPlayer)) return;

    // Mark AI as thinking
    const updatedPlayers = game.players.map((p) =>
      p.type === "ai" ? { ...p, isThinking: true } : p
    );
    await ctx.db.patch(game._id, { players: updatedPlayers } as any);

    // Schedule AI card selection
    await ctx.scheduler.runAfter(0, internal.games.selectAICard, { gameId });
  },
});

export const selectAICard = internalAction({
  args: { gameId: v.string() },
  handler: async (ctx, { gameId }) => {
    const game = await ctx.runQuery(internal.games.getGameInternal, { gameId });
    if (!game) return;

    const aiPlayer = game.players.find((p) => p.type === "ai");
    if (!aiPlayer?.hand) return;

    const playableCards = aiPlayer.hand.filter((card) => card.playable);
    if (playableCards.length === 0) return;

    // Use AI logic
    const { chooseAICard } = await import("./aiPlayer");
    const difficulty = aiPlayer.aiDifficulty ?? "medium";
    const chosenCard = chooseAICard(game, difficulty);

    if (!chosenCard) {
      // Fallback to random
      const randomIndex = Math.floor(Math.random() * playableCards.length);
      const fallbackCard = playableCards[randomIndex];
      await ctx.runMutation(internal.games.playCardInternal, {
        gameId,
        cardId: fallbackCard.id,
        playerId: getPlayerId(aiPlayer),
      });
      return;
    }

    // Play the card
    await ctx.runMutation(internal.games.playCardInternal, {
      gameId,
      cardId: chosenCard.id,
      playerId: getPlayerId(aiPlayer),
    });
  },
});

export const getGameInternal = internalQuery({
  args: { gameId: v.string() },
  handler: async (ctx, { gameId }) => {
    return await ctx.db
      .query("games")
      .withIndex("by_game_id", (q) => q.eq("gameId", gameId))
      .first();
  },
});

export const playCardInternal = internalMutation({
  args: {
    gameId: v.string(),
    cardId: v.string(),
    playerId: v.union(v.id("users"), v.string()),
  },
  handler: async (ctx, { gameId, cardId, playerId }) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_game_id", (q) => q.eq("gameId", gameId))
      .first();

    if (!game) return;

    // Use the same playCard logic
    const validation = validatePlayCardAction(cardId, playerId, game);
    if (!validation.valid) return;

    const player = game.players.find((p) => getPlayerId(p) === playerId)!;
    const card = player.hand?.find((c) => c.id === cardId);
    if (!card) return;

    const newPlayedCards = [
      ...game.playedCards,
      {
        card,
        playerId,
        round: game.currentRound,
        timestamp: Date.now(),
      },
    ];

    const playersAfterCardRemoval = game.players.map((p) =>
      getPlayerId(p) === playerId ?
        {
          ...p,
          hand: p.hand?.filter((c) => c.id !== cardId),
          isThinking: false,
        }
      : p
    );

    let gameState: Game = {
      ...game,
      players: playersAfterCardRemoval,
      playedCards: newPlayedCards,
    } as Game;

    // Add card played to history
    gameState = addHistoryEntry(gameState, "card_played", playerId, {
      message: `${player.username} a joué ${card.rank} de ${card.suit}`,
      cardId: card.id,
      cardSuit: card.suit,
      cardRank: card.rank,
      round: game.currentRound,
    });

    const currentRoundCards = newPlayedCards.filter(
      (p) => p.round === game.currentRound
    );

    if (currentRoundCards.length === 2) {
      const firstCard = currentRoundCards[0];
      const secondCard = currentRoundCards[1];

      if (!firstCard || !secondCard) return;

      const winnerId = determineRoundWinner(
        firstCard,
        secondCard,
        game.hasHandPlayerId ?? ""
      );

      gameState.hasHandPlayerId = winnerId;

      // Add round won to history
      const winnerName = gameState.players.find(
        (p) => getPlayerId(p) === winnerId
      )?.username;
      gameState = addHistoryEntry(gameState, "round_won", winnerId, {
        message: `${winnerName} remporte le tour ${game.currentRound}`,
        winnerId,
        round: game.currentRound,
      });
      gameState.version = gameState.version + 1;
      gameState.lastUpdatedAt = Date.now();

      if (game.currentRound === 5) {
        const winnerCard = currentRoundCards.find(
          (rc) => rc.playerId === winnerId
        )?.card;

        if (winnerCard && winnerCard.rank === "3") {
          const rounds3to5 = [3, 4, 5].map((round) => {
            const roundCards = game.playedCards.filter(
              (pc) => pc.round === round && pc.playerId === winnerId
            );
            return roundCards.length > 0 && roundCards[0].card.rank === "3" ?
                1
              : 0;
          });

          let consecutiveThrees = 0;
          if (
            rounds3to5[0] === 1 &&
            rounds3to5[1] === 1 &&
            rounds3to5[2] === 1
          ) {
            consecutiveThrees = 3;
          } else if (rounds3to5[1] === 1 && rounds3to5[2] === 1) {
            consecutiveThrees = 2;
          } else if (rounds3to5[2] === 1) {
            consecutiveThrees = 1;
          }

          const multiplier = calculateKoraMultiplier(consecutiveThrees);
          const koraType = getKoraType(consecutiveThrees);
          const betAmount = game.bet.amount;
          const totalBet = betAmount * 2;
          const platformFee = totalBet * 0.02;
          const korasWon = (totalBet - platformFee) * multiplier;

          gameState.players = gameState.players.map((p) => ({
            ...p,
            balance:
              getPlayerId(p) === winnerId ?
                p.balance + korasWon
              : p.balance - betAmount,
          }));

          // Credit winnings to winner (only if human player)
          const winnerPlayer = gameState.players.find(
            (p) => getPlayerId(p) === winnerId
          );
          if (winnerPlayer?.userId) {
            const winner = await ctx.db.get(winnerPlayer.userId);
            if (winner) {
              await ctx.db.patch(winnerPlayer.userId, {
                balance: (winner.balance || 0) + korasWon,
              });
              await ctx.db.insert("transactions", {
                userId: winnerPlayer.userId,
                type: "win",
                amount: korasWon,
            currency: game.bet.currency,
                gameId: game.gameId,
                description: `Gain de ${korasWon} ${game.bet.currency} (${koraType})`,
                createdAt: Date.now(),
              });
            }
          }

          gameState = addHistoryEntry(gameState, "kora_achieved", winnerId, {
            message: `🎯 ${koraType} ! Multiplicateur x${multiplier} !`,
            koraType,
            multiplier,
            winnerId,
          });
          gameState.version = gameState.version + 1;
          gameState.lastUpdatedAt = Date.now();
        }
      }

      const anyPlayerOutOfCards = gameState.players.some(
        (p) => p.hand?.length === 0
      );
      if (game.currentRound >= 5 || anyPlayerOutOfCards) {
        const betAmount = game.bet.amount;
        const totalBet = betAmount * 2;
        const platformFee = totalBet * 0.02;
        const winnings = totalBet - platformFee;

        gameState.status = "ENDED" as const;
        gameState.winnerId = winnerId;
        gameState.endedAt = Date.now();

        const winnerPlayer = gameState.players.find(
          (p) => getPlayerId(p) === winnerId
        );

        gameState.players = gameState.players.map((p) => ({
          ...p,
          balance:
            getPlayerId(p) === winnerId ?
              p.balance + winnings
            : p.balance - betAmount,
        }));

        // Credit winnings to winner (only if human player)
        if (winnerPlayer?.userId) {
          const winner = await ctx.db.get(winnerPlayer.userId);
          if (winner) {
            await ctx.db.patch(winnerPlayer.userId, {
              balance: (winner.balance || 0) + winnings,
            });
            await ctx.db.insert("transactions", {
              userId: winnerPlayer.userId,
              type: "win",
              amount: winnings,
              currency: game.bet.currency,
              gameId: game.gameId,
              description: `Gain de ${winnings} ${game.bet.currency}`,
              createdAt: Date.now(),
            });
          }
        }

        const winnerName = gameState.players.find(
          (p) => getPlayerId(p) === winnerId
        )?.username;
        gameState = addHistoryEntry(gameState, "game_ended", winnerId, {
          message: `🏆 ${winnerName} remporte la partie !`,
          winnerId,
        });
        gameState.version = gameState.version + 1;
        gameState.lastUpdatedAt = Date.now();
      } else {
        gameState.currentRound++;
      }
    }

    gameState.currentTurnPlayerId = updatePlayerTurn(gameState);
    gameState = updatePlayableCards(gameState);

    await ctx.db.patch(game._id, gameState as any);

    // Trigger AI if needed
    if (game.mode === "AI" && gameState.status === "PLAYING") {
      const aiPlayer = gameState.players.find((p) => p.type === "ai");
      if (aiPlayer && gameState.currentTurnPlayerId === getPlayerId(aiPlayer)) {
        await ctx.scheduler.runAfter(1000, internal.games.triggerAITurn, {
          gameId,
        });
      }
    }
  },
});

// ========== UTILITY MUTATIONS ==========

export const joinGame = mutation({
  args: {
    gameId: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, { gameId, userId }) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_game_id", (q) => q.eq("gameId", gameId))
      .first();

    if (!game) {
      throw new Error("Game not found");
    }

    if (game.status !== "WAITING") {
      throw new Error("Game already started");
    }

    if (game.players.length >= game.maxPlayers) {
      throw new Error("Game is full");
    }

    // Check if player is already in the game
    const isAlreadyInGame = game.players.some((p) => p.userId === userId);
    if (isAlreadyInGame) {
      throw new Error("You are already in this game");
    }

    // Get user info
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const newPlayer: any = {
      userId: userId,
      username: user.username,
      type: "user",
      isConnected: true,
      avatar: user.avatarUrl,
      balance: 0,
    };

    await ctx.db.patch(game._id, {
      players: [...game.players, newPlayer],
    } as any);

    // Auto-start game after delay if all players joined (ONLINE mode)
    if (game.mode === "ONLINE" && game.players.length + 1 >= game.maxPlayers) {
      await ctx.scheduler.runAfter(3000, internal.games.autoStartGame, {
        gameId,
      });
    }

    return { success: true };
  },
});

// Rematch mutation
export const createRematch = mutation({
  args: {
    originalGameId: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, { originalGameId, userId }) => {
    const originalGame = await ctx.db
      .query("games")
      .withIndex("by_game_id", (q) => q.eq("gameId", originalGameId))
      .first();

    if (!originalGame) {
      throw new Error("Original game not found");
    }

    if (originalGame.status !== "ENDED") {
      throw new Error("Game must be ended to create rematch");
    }

    // Check if rematch already exists
    if (originalGame.rematchGameId) {
      return { gameId: originalGame.rematchGameId, isNewGame: false };
    }

    // Create new game with same settings
    const seed = crypto.randomUUID();
    const newGameId = `game-${seed}`;

    // Get host user info
    const host = await ctx.db.get(userId);
    if (!host) {
      throw new Error("Host user not found");
    }

    const players: any[] = [
      {
        userId: userId,
        username: host.username,
        type: "user",
        isConnected: true,
        avatar: host.avatarUrl,
        balance: 0,
      },
    ];

    // Add AI player if mode is AI
    if (originalGame.mode === "AI") {
      const difficulty = originalGame.aiDifficulty ?? "medium";
      players.push({
        userId: null,
        botId: getAIBotId(difficulty),
        username: getAIBotUsername(difficulty),
        type: "ai",
        isConnected: true,
        balance: 0,
        aiDifficulty: difficulty,
      });
    }

    const now = Date.now();

    const gameData = {
      gameId: newGameId,
      seed,
      version: 1,
      status: "WAITING" as const,
      currentRound: 1,
      maxRounds: originalGame.maxRounds,
      hasHandPlayerId: null as Id<"users"> | string | null,
      currentTurnPlayerId: null as Id<"users"> | string | null,
      players,
      playedCards: [],
      bet: {
        amount: originalGame.bet.amount,
        currency: originalGame.bet.currency,
      },
      winnerId: null as Id<"users"> | string | null,
      endReason: null as string | null,
      history: [
        {
          action: "game_created" as const,
          timestamp: now,
          playerId: userId,
          data: {
            message: `Revanche créée par ${players[0].username}`,
          },
        },
      ],
      mode: originalGame.mode,
      maxPlayers: originalGame.maxPlayers,
      aiDifficulty:
        originalGame.mode === "AI" ?
          (originalGame.aiDifficulty ?? "medium")
        : null,
      roomName: originalGame.roomName,
      isPrivate: originalGame.mode === "ONLINE" ? true : false, // Rematch is always private for multiplayer
      hostId: userId,
      joinCode:
        originalGame.mode === "ONLINE" ?
          crypto.randomUUID().slice(0, 6).toUpperCase()
        : undefined,
      startedAt: now,
      endedAt: null as number | null,
      lastUpdatedAt: now,
      victoryType: null as string | null,
      rematchGameId: null as string | null,
    };

    await ctx.db.insert("games", gameData as any);

    // Mark original game with rematch
    await ctx.db.patch(originalGame._id, {
      rematchGameId: newGameId,
    });

    // Auto-start AI game immediately
    if (originalGame.mode === "AI") {
      await ctx.scheduler.runAfter(0, internal.games.autoStartGame, {
        gameId: newGameId,
      });
    }

    return { gameId: newGameId, isNewGame: true };
  },
});

// Internal mutation for auto-starting games
export const autoStartGame = internalMutation({
  args: { gameId: v.string() },
  handler: async (ctx, { gameId }) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_game_id", (q) => q.eq("gameId", gameId))
      .first();

    if (!game) return;
    if (game.status !== "WAITING") return;
    if (game.players.length < game.maxPlayers) return;

    // Start the game using the same logic as startGame
    const deck = createDeck(game.seed);

    // Distribute 5 cards to each player
    const updatedPlayers = game.players.map((player, index) => {
      const playerHand = deck.slice(index * 5, (index + 1) * 5);
      return {
        ...player,
        hand: playerHand,
        playableCards: playerHand.map((c) => c.id),
        roundsWon: 0,
      };
    });

    // Randomly choose starting player
    const startingPlayerIndex = Math.floor(Math.random() * game.players.length);
    const startingPlayerId = getPlayerId(updatedPlayers[startingPlayerIndex]);

    let gameState: Game = {
      ...game,
      status: "PLAYING" as const,
      players: updatedPlayers,
      hasHandPlayerId: startingPlayerId,
      currentTurnPlayerId: startingPlayerId,
    };

    // Add history entry
    gameState = addHistoryEntry(
      gameState,
      "game_started" as any,
      startingPlayerId,
      { message: "La partie commence !" }
    );

    // Update game in database
    await ctx.db.patch(game._id, {
      status: gameState.status,
      players: gameState.players,
      hasHandPlayerId: gameState.hasHandPlayerId,
      currentTurnPlayerId: gameState.currentTurnPlayerId,
      history: gameState.history,
      version: gameState.version,
      lastUpdatedAt: gameState.lastUpdatedAt,
    } as any);

    // Trigger AI turn if needed
    if (game.mode === "AI") {
      const aiPlayer = gameState.players.find((p) => p.type === "ai");
      if (aiPlayer && gameState.currentTurnPlayerId === getPlayerId(aiPlayer)) {
        await ctx.scheduler.runAfter(1000, internal.games.triggerAITurn, {
          gameId: game.gameId,
        });
      }
    }
  },
});

export const getUserGameHistory = query({
  args: {
    clerkUserId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { clerkUserId, limit = 20 }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", clerkUserId))
      .first();

    if (!user) {
      return [];
    }

    const endedGames = await ctx.db
      .query("games")
      .withIndex("by_status", (q) => q.eq("status", "ENDED"))
      .collect();

    const userGames = endedGames
      .filter((game) => game.players.some((p) => p.userId === user._id))
      .sort((a, b) => (b.endedAt || 0) - (a.endedAt || 0))
      .slice(0, limit);

    const gamesWithOpponentInfo = await Promise.all(
      userGames.map(async (game) => {
        const opponent = game.players.find((p) => p.userId !== user._id);
        let opponentInfo = null;

        if (opponent) {
          if (opponent.type === "ai") {
            opponentInfo = {
              username: opponent.username,
              avatarUrl: null,
              isAI: true,
            };
          } else if (opponent.userId) {
            const opponentUser = await ctx.db.get(opponent.userId);
            opponentInfo = {
              username: opponentUser?.username || "Joueur",
              avatarUrl: opponentUser?.avatarUrl || null,
              isAI: false,
            };
          }
        }

        const isWinner = game.winnerId === user._id;
        const gain = isWinner ? game.bet.amount : -game.bet.amount;

        return {
          gameId: game.gameId,
          _id: game._id,
          opponent: opponentInfo,
          result: isWinner ? ("win" as const) : ("loss" as const),
          bet: game.bet,
          gain,
          endedAt: game.endedAt,
          victoryType: game.victoryType,
          mode: game.mode,
          currentRound: game.currentRound,
        };
      })
    );

    return gamesWithOpponentInfo;
  },
});

export const getRecentGames = query({
  args: {
    clerkUserId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { clerkUserId, limit = 5 }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", clerkUserId))
      .first();

    if (!user) {
      return [];
    }

    const endedGames = await ctx.db
      .query("games")
      .withIndex("by_status", (q) => q.eq("status", "ENDED"))
      .collect();

    const userGames = endedGames
      .filter((game) => game.players.some((p) => p.userId === user._id))
      .sort((a, b) => (b.endedAt || 0) - (a.endedAt || 0))
      .slice(0, limit);

    return Promise.all(
      userGames.map(async (game) => {
        const opponent = game.players.find((p) => p.userId !== user._id);
        let opponentName = "Adversaire";

        if (opponent) {
          if (opponent.type === "ai") {
            opponentName = opponent.username;
          } else if (opponent.userId) {
            const opponentUser = await ctx.db.get(opponent.userId);
            opponentName = opponentUser?.username || "Joueur";
          }
        }

        const isWinner = game.winnerId === user._id;

        return {
          gameId: game.gameId,
          opponentName,
          result: isWinner ? ("win" as const) : ("loss" as const),
          betAmount: game.bet.amount,
          endedAt: game.endedAt,
        };
      })
    );
  },
});
