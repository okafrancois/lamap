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
import { getMinimumBalance } from "./currencies";
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
import { INITIAL_PR } from "./ranking";
import {
  aiDifficultyValidator,
  currencyValidator,
  gameModeValidator,
} from "./validators";

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
    const hostedGames = await ctx.db
      .query("games")
      .withIndex("by_host", (q) => q.eq("hostId", userId))
      .collect();

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
    const waitingGames = await ctx.db
      .query("games")
      .withIndex("by_status", (q) => q.eq("status", "WAITING"))
      .collect();

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

    if (args.mode === "AI") {
      const difficulty = args.aiDifficulty ?? "medium";
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

    const deck = createDeck(game.seed);
    const firstPlayerHand = deck.slice(0, 5);
    const secondPlayerHand = deck.slice(5, 10);

    const startingPlayerId =
      Math.random() < 0.5 ?
        (game.players[0].userId ??
        getAIBotId(game.players[0].aiDifficulty ?? "medium"))
      : (game.players[1].userId ??
        getAIBotId(game.players[1].aiDifficulty ?? "medium"));

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

      let victoryType: "auto_sevens" | "auto_sum" | null = null;
      if (autoVictory.reason) {
        if (
          autoVictory.reason.includes("cartes de 7") ||
          autoVictory.reason.includes("7")
        ) {
          victoryType = "auto_sevens";
        } else if (autoVictory.reason.includes("Somme < 21")) {
          victoryType = "auto_sum";
        }
      }

      if (winnerPlayer?.userId && game.bet.amount > 0) {
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

      const shouldUpdatePR =
        game.mode !== "AI" &&
        (game.mode === "RANKED" || game.competitive === true);
      if (shouldUpdatePR && winnerPlayer?.userId) {
        const loserPlayer = updatedPlayers.find(
          (p) => getPlayerId(p) !== winnerId && p.userId
        );

        if (loserPlayer?.userId) {
          const winnerUser = await ctx.db.get(winnerPlayer.userId);
          const loserUser = await ctx.db.get(loserPlayer.userId);
          const winnerPR = winnerUser?.pr || INITIAL_PR;
          const loserPR = loserUser?.pr || INITIAL_PR;

          try {
            await ctx.scheduler.runAfter(
              0,
              internal.ranking.updatePlayerPRInternal,
              {
                playerId: winnerPlayer.userId,
                opponentId: loserPlayer.userId,
                playerPR: winnerPR,
                opponentPR: loserPR,
                playerWon: true,
                gameId: game.gameId,
              }
            );

            await ctx.scheduler.runAfter(
              0,
              internal.ranking.updatePlayerPRInternal,
              {
                playerId: loserPlayer.userId,
                opponentId: winnerPlayer.userId,
                playerPR: loserPR,
                opponentPR: winnerPR,
                playerWon: false,
                gameId: game.gameId,
              }
            );
          } catch (error) {
            console.error("Erreur mise à jour PR:", error);
          }
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

      await ctx.scheduler.runAfter(
        0,
        internal.matchmaking.cleanupQueueForGame,
        {
          gameId,
        }
      );

      return { gameId, winnerId, autoVictory: true };
    }

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

    if (game.timerEnabled && game.playerTimers && startingPlayerId) {
      await updateTimersOnTurnChange(ctx, game, null, startingPlayerId);
      const updatedGame = await ctx.db
        .query("games")
        .withIndex("by_game_id", (q) => q.eq("gameId", game.gameId))
        .first();
      if (updatedGame) {
        gameState.playerTimers = updatedGame.playerTimers;
      }
    }

    await ctx.db.patch(game._id, gameState as any);

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

async function endGameByTimeExpiration(
  ctx: any,
  game: any,
  expiredPlayerId: string | Id<"users">
): Promise<Game> {
  const winnerPlayer = game.players.find(
    (p: any) => getPlayerId(p) !== expiredPlayerId
  );
  const winnerId = winnerPlayer ? getPlayerId(winnerPlayer) : null;

  if (!winnerId) {
    throw new Error("Could not determine winner");
  }

  const betAmount = game.bet.amount;
  const totalBet = betAmount * 2;
  const platformFee = totalBet * 0.02;
  const winnings = totalBet - platformFee;

  let gameState: Game = {
    ...game,
    status: "ENDED" as const,
    winnerId: winnerId,
    endedAt: Date.now(),
    victoryType: "on_time" as const,
    endReason: "Time expired",
    players: game.players.map((p: any) => ({
      ...p,
      balance:
        getPlayerId(p) === winnerId ?
          p.balance + winnings
        : p.balance - betAmount,
    })),
    version: game.version + 1,
    lastUpdatedAt: Date.now(),
  };

  await ctx.scheduler.runAfter(0, internal.matchmaking.cleanupQueueForGame, {
    gameId: game.gameId,
  });

  if (winnerPlayer?.userId && game.bet.amount > 0) {
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
        description: `Gain de ${winnings} ${game.bet.currency} (temps expiré)`,
        createdAt: Date.now(),
      });
    }
  }

  const expiredPlayer = game.players.find(
    (p: any) => getPlayerId(p) === expiredPlayerId
  );
  const expiredPlayerName = expiredPlayer?.username || "Joueur";
  const winnerName = winnerPlayer?.username || "Joueur";

  gameState = addHistoryEntry(gameState, "game_ended", winnerId, {
    message: `⏱️ ${expiredPlayerName} a manqué de temps. ${winnerName} remporte la partie !`,
    winnerId,
  });

  const shouldUpdatePR =
    game.mode !== "AI" && (game.mode === "RANKED" || game.competitive === true);
  if (shouldUpdatePR && winnerPlayer?.userId) {
    const loserPlayer = gameState.players.find(
      (p: any) => getPlayerId(p) !== winnerId && p.userId
    );

    if (loserPlayer?.userId) {
      const winnerUser = await ctx.db.get(winnerPlayer.userId);
      const loserUser = await ctx.db.get(loserPlayer.userId);
      const winnerPR = winnerUser?.pr || INITIAL_PR;
      const loserPR = loserUser?.pr || INITIAL_PR;

      try {
        await ctx.scheduler.runAfter(
          0,
          internal.ranking.updatePlayerPRInternal,
          {
            playerId: winnerPlayer.userId,
            opponentId: loserPlayer.userId,
            playerPR: winnerPR,
            opponentPR: loserPR,
            playerWon: true,
          }
        );

        await ctx.scheduler.runAfter(
          0,
          internal.ranking.updatePlayerPRInternal,
          {
            playerId: loserPlayer.userId,
            opponentId: winnerPlayer.userId,
            playerPR: loserPR,
            opponentPR: winnerPR,
            playerWon: false,
          }
        );
      } catch (error) {
        console.error("Erreur mise à jour PR:", error);
      }
    }
  }

  return gameState;
}

async function updateTimersOnTurnChange(
  ctx: any,
  game: any,
  previousPlayerId: string | Id<"users"> | null,
  newPlayerId: string | Id<"users"> | null
) {
  if (!game.timerEnabled || !game.playerTimers) {
    return;
  }

  const freshGame = await ctx.db.get(game._id);

  if (!freshGame || !freshGame.playerTimers) {
    return;
  }

  const now = Date.now();
  const updatedTimers = freshGame.playerTimers.map((timer: any) => {
    if (timer.playerId === previousPlayerId && previousPlayerId) {
      const elapsedSeconds = Math.floor((now - timer.lastUpdated) / 1000);
      const newTimeRemaining = Math.max(
        0,
        timer.timeRemaining - elapsedSeconds
      );
      return {
        ...timer,
        timeRemaining: newTimeRemaining,
        lastUpdated: now,
      };
    } else if (timer.playerId === newPlayerId && newPlayerId) {
      return {
        ...timer,
        lastUpdated: now,
      };
    }
    return timer;
  });

  await ctx.db.patch(freshGame._id, {
    playerTimers: updatedTimers,
    lastUpdatedAt: now,
  });
}

export const playCard = mutation({
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

    if (!game) {
      throw new Error("Game not found");
    }

    if (game.timerEnabled && game.playerTimers) {
      const now = Date.now();
      const playerTimer = game.playerTimers.find(
        (t) => t.playerId === playerId
      );

      if (playerTimer) {
        const elapsedSeconds = Math.floor(
          (now - playerTimer.lastUpdated) / 1000
        );
        const actualTimeRemaining = Math.max(
          0,
          playerTimer.timeRemaining - elapsedSeconds
        );

        if (actualTimeRemaining === 0) {
          const gameState = await endGameByTimeExpiration(ctx, game, playerId);
          await ctx.db.patch(game._id, gameState as any);
          return { success: true, gameState };
        }
      }
    }

    const validation = validatePlayCardAction(cardId, playerId, game);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const player = game.players.find((p) => getPlayerId(p) === playerId)!;
    const card = player.hand?.find((c) => c.id === cardId);
    if (!card) {
      throw new Error("Card not found");
    }

    const newPlayedCards = [
      ...game.playedCards,
      {
        card,
        playerId,
        round: game.currentRound,
        timestamp: Date.now(),
      },
    ];

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

      if (!firstCard || !secondCard) {
        throw new Error("Invalid round cards");
      }

      const winnerId = determineRoundWinner(
        firstCard,
        secondCard,
        game.hasHandPlayerId ?? ""
      );

      gameState.hasHandPlayerId = winnerId;

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

          const winnerPlayer = gameState.players.find(
            (p) => getPlayerId(p) === winnerId
          );
          if (winnerPlayer?.userId && game.bet.amount > 0) {
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
        if (!gameState.victoryType) {
          gameState.victoryType = "normal";
        }

        await ctx.scheduler.runAfter(
          0,
          internal.matchmaking.cleanupQueueForGame,
          {
            gameId: game.gameId,
          }
        );

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

        if (winnerPlayer?.userId && game.bet.amount > 0) {
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

        const shouldUpdatePR =
          game.mode !== "AI" &&
          (game.mode === "RANKED" || game.competitive === true);
        if (shouldUpdatePR && winnerPlayer?.userId) {
          const loserPlayer = gameState.players.find(
            (p) => getPlayerId(p) !== winnerId && p.userId
          );

          if (loserPlayer?.userId) {
            const winnerUser = await ctx.db.get(winnerPlayer.userId);
            const loserUser = await ctx.db.get(loserPlayer.userId);
            const winnerPR = winnerUser?.pr || INITIAL_PR;
            const loserPR = loserUser?.pr || INITIAL_PR;

            try {
              await ctx.scheduler.runAfter(
                0,
                internal.ranking.updatePlayerPRInternal,
                {
                  playerId: winnerPlayer.userId,
                  opponentId: loserPlayer.userId,
                  playerPR: winnerPR,
                  opponentPR: loserPR,
                  playerWon: true,
                }
              );

              await ctx.scheduler.runAfter(
                0,
                internal.ranking.updatePlayerPRInternal,
                {
                  playerId: loserPlayer.userId,
                  opponentId: winnerPlayer.userId,
                  playerPR: loserPR,
                  opponentPR: winnerPR,
                  playerWon: false,
                }
              );
            } catch (error) {
              console.error("Erreur mise à jour PR:", error);
            }
          }
        }
      } else {
        gameState.currentRound++;
      }
    }

    const previousTurnPlayerId = gameState.currentTurnPlayerId;
    gameState.currentTurnPlayerId = updatePlayerTurn(gameState);
    gameState = updatePlayableCards(gameState);

    if (game.timerEnabled && game.playerTimers) {
      await updateTimersOnTurnChange(
        ctx,
        game,
        previousTurnPlayerId,
        gameState.currentTurnPlayerId
      );
      const updatedGame = await ctx.db
        .query("games")
        .withIndex("by_game_id", (q) => q.eq("gameId", game.gameId))
        .first();
      if (updatedGame) {
        gameState.playerTimers = updatedGame.playerTimers;
      }
    }

    await ctx.db.patch(game._id, gameState as any);

    if (
      game.timerEnabled &&
      game.playerTimers &&
      gameState.status === "PLAYING" &&
      typeof gameState.currentTurnPlayerId === "string" &&
      !gameState.currentTurnPlayerId.startsWith("ai-")
    ) {
    }

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

    const updatedPlayers = game.players.map((p) =>
      p.type === "ai" ? { ...p, isThinking: true } : p
    );
    await ctx.db.patch(game._id, { players: updatedPlayers } as any);

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

    const { chooseAICard } = await import("./ai/aiPlayer");
    const difficulty = aiPlayer.aiDifficulty ?? "medium";
    const chosenCard = await chooseAICard(game, difficulty);

    if (!chosenCard) {
      const randomIndex = Math.floor(Math.random() * playableCards.length);
      const fallbackCard = playableCards[randomIndex];
      await ctx.runMutation(internal.games.playCardInternal, {
        gameId,
        cardId: fallbackCard.id,
        playerId: getPlayerId(aiPlayer),
      });
      return;
    }

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

          const winnerPlayer = gameState.players.find(
            (p) => getPlayerId(p) === winnerId
          );
          if (winnerPlayer?.userId && game.bet.amount > 0) {
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
        if (!gameState.victoryType) {
          gameState.victoryType = "normal";
        }

        await ctx.scheduler.runAfter(
          0,
          internal.matchmaking.cleanupQueueForGame,
          {
            gameId: game.gameId,
          }
        );

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

        if (winnerPlayer?.userId && game.bet.amount > 0) {
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

        const shouldUpdatePR =
          game.mode !== "AI" &&
          (game.mode === "RANKED" || game.competitive === true);
        if (shouldUpdatePR && winnerPlayer?.userId) {
          const loserPlayer = gameState.players.find(
            (p) => getPlayerId(p) !== winnerId && p.userId
          );

          if (loserPlayer?.userId) {
            const winnerUser = await ctx.db.get(winnerPlayer.userId);
            const loserUser = await ctx.db.get(loserPlayer.userId);
            const winnerPR = winnerUser?.pr || INITIAL_PR;
            const loserPR = loserUser?.pr || INITIAL_PR;

            try {
              await ctx.scheduler.runAfter(
                0,
                internal.ranking.updatePlayerPRInternal,
                {
                  playerId: winnerPlayer.userId,
                  opponentId: loserPlayer.userId,
                  playerPR: winnerPR,
                  opponentPR: loserPR,
                  playerWon: true,
                }
              );

              await ctx.scheduler.runAfter(
                0,
                internal.ranking.updatePlayerPRInternal,
                {
                  playerId: loserPlayer.userId,
                  opponentId: winnerPlayer.userId,
                  playerPR: loserPR,
                  opponentPR: winnerPR,
                  playerWon: false,
                }
              );
            } catch (error) {
              console.error("Erreur mise à jour PR:", error);
            }
          }
        }
      } else {
        gameState.currentRound++;
      }
    }

    const previousTurnPlayerId = gameState.currentTurnPlayerId;
    gameState.currentTurnPlayerId = updatePlayerTurn(gameState);
    gameState = updatePlayableCards(gameState);

    if (game.timerEnabled && game.playerTimers) {
      await updateTimersOnTurnChange(
        ctx,
        game,
        previousTurnPlayerId,
        gameState.currentTurnPlayerId
      );
      const updatedGame = await ctx.db
        .query("games")
        .withIndex("by_game_id", (q) => q.eq("gameId", game.gameId))
        .first();
      if (updatedGame) {
        gameState.playerTimers = updatedGame.playerTimers;
      }
    }

    await ctx.db.patch(game._id, gameState as any);
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
      throw new Error("Partie non trouvée");
    }

    if (game.status !== "WAITING") {
      throw new Error("Partie déjà commencée");
    }

    if (game.players.length >= game.maxPlayers) {
      throw new Error("Partie pleine");
    }

    const isAlreadyInGame = game.players.some((p) => p.userId === userId);
    if (isAlreadyInGame) {
      throw new Error("Vous êtes déjà dans cette partie");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("Utilisateur non trouvé");
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

    if (game.mode === "ONLINE" && game.players.length + 1 >= game.maxPlayers) {
      await ctx.scheduler.runAfter(3000, internal.games.autoStartGame, {
        gameId,
      });
    }

    return { success: true };
  },
});

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

    if (originalGame.rematchGameId) {
      return { gameId: originalGame.rematchGameId, isNewGame: false };
    }

    const seed = crypto.randomUUID();
    const newGameId = `game-${seed}`;

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
      isPrivate: originalGame.mode === "ONLINE" ? true : false,
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

    await ctx.db.patch(originalGame._id, {
      rematchGameId: newGameId,
    });

    if (originalGame.mode === "AI") {
      await ctx.scheduler.runAfter(0, internal.games.autoStartGame, {
        gameId: newGameId,
      });
    }

    return { gameId: newGameId, isNewGame: true };
  },
});

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

    const deck = createDeck(game.seed);

    const updatedPlayers = game.players.map((player, index) => {
      const playerHand = deck.slice(index * 5, (index + 1) * 5);
      return {
        ...player,
        hand: playerHand,
        playableCards: playerHand.map((c) => c.id),
        roundsWon: 0,
      };
    });

    const startingPlayerIndex = Math.floor(Math.random() * game.players.length);
    const startingPlayerId = getPlayerId(updatedPlayers[startingPlayerIndex]);

    let gameState: Game = {
      ...game,
      status: "PLAYING" as const,
      players: updatedPlayers,
      hasHandPlayerId: startingPlayerId,
      currentTurnPlayerId: startingPlayerId,
    };

    gameState = addHistoryEntry(
      gameState,
      "game_started" as any,
      startingPlayerId,
      { message: "La partie commence !" }
    );

    await ctx.db.patch(game._id, {
      status: gameState.status,
      players: gameState.players,
      hasHandPlayerId: gameState.hasHandPlayerId,
      currentTurnPlayerId: gameState.currentTurnPlayerId,
      history: gameState.history,
      version: gameState.version,
      lastUpdatedAt: gameState.lastUpdatedAt,
    } as any);

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
    clerkUserId: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    viewerUserId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { clerkUserId, userId, viewerUserId, limit = 20 }) => {
    let user;
    if (userId) {
      user = await ctx.db.get(userId);
    } else if (clerkUserId) {
      user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", clerkUserId))
        .first();
    } else {
      return [];
    }

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
              _id: opponent.userId,
              username: opponentUser?.username || "Joueur",
              avatarUrl: opponentUser?.avatarUrl || null,
              isAI: false,
            };
          }
        }

        const isWinner = game.winnerId === user._id;
        const isOwner = viewerUserId ? viewerUserId === user._id : true;
        const isCashGame = game.mode === "CASH";

        const shouldMaskBet = isCashGame && !isOwner;

        const gain =
          shouldMaskBet ? 0
          : isWinner ? game.bet.amount
          : -game.bet.amount;

        return {
          gameId: game.gameId,
          _id: game._id,
          opponent: opponentInfo,
          result: isWinner ? ("win" as const) : ("loss" as const),
          bet: {
            amount: shouldMaskBet ? 0 : game.bet.amount,
            currency: game.bet.currency,
            masked: shouldMaskBet,
          },
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
          mode: game.mode,
        };
      })
    );
  },
});

export const concedeGame = mutation({
  args: {
    gameId: v.string(),
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_game_id", (q) => q.eq("gameId", args.gameId))
      .first();

    if (!game) {
      throw new Error("Game not found");
    }

    if (game.status !== "PLAYING") {
      throw new Error("Game is not in progress");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const playerIndex = game.players.findIndex((p) => p.userId === user._id);
    if (playerIndex === -1) {
      throw new Error("User is not a player in this game");
    }

    const opponentIndex = playerIndex === 0 ? 1 : 0;
    const opponent = game.players[opponentIndex];
    const winnerId = opponent.userId || opponent.botId;
    const now = Date.now();

    await ctx.db.patch(game._id, {
      status: "ENDED",
      winnerId: winnerId,
      endReason: "Adversaire a abandonné",
      victoryType: "forfeit",
      endedAt: now,
      lastUpdatedAt: now,
      version: game.version + 1,
      history: [
        ...game.history,
        {
          action: "game_ended" as const,
          timestamp: now,
          playerId: user._id,
          data: {
            message: `${user.username} a abandonné la partie`,
            winnerId,
          },
        },
      ],
    } as any);

    await ctx.scheduler.runAfter(0, internal.matchmaking.cleanupQueueForGame, {
      gameId: game.gameId,
    });

    const forfeitPlayer = game.players[playerIndex];
    const opponentPlayer = game.players[opponentIndex];

    const shouldUpdatePR =
      game.mode !== "AI" &&
      (game.mode === "RANKED" || game.competitive === true);
    if (shouldUpdatePR && forfeitPlayer.userId && opponentPlayer.userId) {
      const forfeitUser = await ctx.db.get(forfeitPlayer.userId);
      const opponentUser = await ctx.db.get(opponentPlayer.userId);
      const forfeitPR = forfeitUser?.pr || INITIAL_PR;
      const opponentPR = opponentUser?.pr || INITIAL_PR;

      try {
        await ctx.scheduler.runAfter(
          0,
          internal.ranking.updatePlayerPRInternal,
          {
            playerId: opponentPlayer.userId,
            opponentId: forfeitPlayer.userId,
            playerPR: opponentPR,
            opponentPR: forfeitPR,
            playerWon: true,
            gameId: game.gameId,
          }
        );
        await ctx.scheduler.runAfter(
          0,
          internal.ranking.updatePlayerPRInternal,
          {
            playerId: forfeitPlayer.userId,
            opponentId: opponentPlayer.userId,
            playerPR: forfeitPR,
            opponentPR: opponentPR,
            playerWon: false,
            gameId: game.gameId,
          }
        );
      } catch (error) {
        console.error("Erreur mise à jour PR:", error);
      }
    }

    if (game.bet.amount > 0 && winnerId && opponentPlayer.userId) {
      const winnings = game.bet.amount * 2;
      const winner = await ctx.db.get(opponentPlayer.userId);

      if (winner) {
        await ctx.db.patch(opponentPlayer.userId, {
          balance: (winner.balance || 0) + winnings,
        });

        await ctx.db.insert("transactions", {
          userId: opponentPlayer.userId,
          type: "win",
          amount: winnings,
          currency: game.bet.currency,
          gameId: game.gameId,
          description: `Gain de ${winnings} ${game.bet.currency} (adversaire a abandonné)`,
          createdAt: Date.now(),
        });
      }
    }

    return { success: true, winnerId };
  },
});

export const sendRevengeRequest = mutation({
  args: {
    originalGameId: v.string(),
    senderId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const originalGame = await ctx.db
      .query("games")
      .withIndex("by_game_id", (q) => q.eq("gameId", args.originalGameId))
      .first();

    if (!originalGame) {
      throw new Error("Partie originale non trouvée");
    }

    if (originalGame.status !== "ENDED") {
      throw new Error(
        "La partie doit être terminée pour demander une revanche"
      );
    }

    const sender = await ctx.db.get(args.senderId);
    if (!sender) {
      throw new Error("Utilisateur non trouvé");
    }

    const opponent = originalGame.players.find(
      (p) => getPlayerId(p) !== args.senderId
    );
    if (!opponent) {
      throw new Error("Adversaire non trouvé");
    }

    const opponentUserId = opponent.userId;
    if (!opponentUserId) {
      throw new Error("Impossible de demander une revanche contre un bot");
    }

    if (opponentUserId === args.senderId) {
      throw new Error("Vous ne pouvez pas demander une revanche à vous-même");
    }

    const existingRequest = await ctx.db
      .query("challenges")
      .withIndex("by_challenger", (q) => q.eq("challengerId", args.senderId))
      .filter((q) =>
        q.and(
          q.eq(q.field("challengedId"), opponentUserId),
          q.eq(q.field("status"), "pending")
        )
      )
      .first();

    if (existingRequest && existingRequest.gameId === args.originalGameId) {
      return { challengeId: existingRequest._id, success: true };
    }

    const gameMode = originalGame.mode === "RANKED" ? "RANKED" : "CASH";
    const now = Date.now();
    const expiresAt = now + 24 * 60 * 60 * 1000;

    const challengeId = await ctx.db.insert("challenges", {
      challengerId: args.senderId,
      challengedId: opponentUserId,
      mode: gameMode,
      betAmount: originalGame.bet.amount,
      currency: originalGame.bet.currency,
      competitive: originalGame.competitive,
      status: "pending",
      createdAt: now,
      expiresAt,
      gameId: args.originalGameId,
    });

    return { challengeId, success: true };
  },
});

export const acceptRevengeRequest = mutation({
  args: {
    challengeId: v.id("challenges"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const challenge = await ctx.db.get(args.challengeId);

    if (!challenge) {
      throw new Error("Proposition de revanche non trouvée");
    }

    if (challenge.challengedId !== args.userId) {
      throw new Error("Vous n'êtes pas autorisé à accepter cette proposition");
    }

    if (challenge.status !== "pending") {
      throw new Error("Cette proposition n'est plus valide");
    }

    const now = Date.now();
    if (now > challenge.expiresAt) {
      await ctx.db.patch(challenge._id, { status: "expired" });
      throw new Error("Cette proposition a expiré");
    }

    const challenger = await ctx.db.get(challenge.challengerId);
    const challenged = await ctx.db.get(challenge.challengedId);

    if (!challenger || !challenged) {
      throw new Error("Utilisateur non trouvé");
    }

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

    await ctx.db.patch(challenge._id, {
      status: "accepted",
      respondedAt: now,
    });

    const betAmount = challenge.betAmount || 0;
    const currency = challenge.currency || challenged.currency || "XAF";

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
        description: `Mise de ${betAmount} ${currency} pour la revanche`,
        createdAt: now,
      });

      await ctx.db.insert("transactions", {
        userId: challenge.challengedId,
        type: "bet",
        amount: -betAmount,
        currency,
        gameId,
        description: `Mise de ${betAmount} ${currency} pour la revanche`,
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
            message: `Revanche acceptée entre ${challenger.username} et ${challenged.username}`,
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
      isPrivate: true,
      hostId: challenge.challengerId,
      joinCode: undefined,
      startedAt: now,
      endedAt: null as number | null,
      lastUpdatedAt: now,
      victoryType: null as string | null,
      rematchGameId: null as string | null,
    };

    await ctx.db.insert("games", gameData as any);

    await ctx.scheduler.runAfter(0, internal.games.autoStartGame, {
      gameId,
    });

    return { gameId, success: true };
  },
});

export const getRevengeRequestStatus = query({
  args: {
    gameId: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_game_id", (q) => q.eq("gameId", args.gameId))
      .first();

    if (!game) {
      return { status: "none" };
    }

    const opponent = game.players.find((p) => getPlayerId(p) !== args.userId);
    if (!opponent) {
      return { status: "none" };
    }

    const opponentUserId = opponent.userId;
    if (!opponentUserId) {
      return { status: "none" };
    }

    const sentRequest = await ctx.db
      .query("challenges")
      .withIndex("by_challenger", (q) => q.eq("challengerId", args.userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("challengedId"), opponentUserId),
          q.or(
            q.eq(q.field("status"), "pending"),
            q.eq(q.field("status"), "accepted")
          ),
          q.eq(q.field("gameId"), args.gameId)
        )
      )
      .first();

    if (sentRequest) {
      if (sentRequest.status === "accepted") {
        // Find the new game created between these two players
        const newGame = await ctx.db
          .query("games")
          .filter((q) =>
            q.and(
              q.neq(q.field("gameId"), args.gameId),
              q.gte(
                q.field("startedAt"),
                sentRequest.respondedAt ?? sentRequest.createdAt
              )
            )
          )
          .order("desc")
          .first();

        if (
          newGame &&
          newGame.players.some((p) => getPlayerId(p) === args.userId) &&
          newGame.players.some((p) => getPlayerId(p) === opponentUserId)
        ) {
          return {
            status: "accepted",
            challengeId: sentRequest._id,
            newGameId: newGame.gameId,
          };
        }
      }
      return { status: "sent", challengeId: sentRequest._id };
    }

    const receivedRequest = await ctx.db
      .query("challenges")
      .withIndex("by_challenged", (q) => q.eq("challengedId", args.userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("challengerId"), opponentUserId),
          q.eq(q.field("status"), "pending"),
          q.eq(q.field("gameId"), args.gameId)
        )
      )
      .first();

    if (receivedRequest) {
      return { status: "received", challengeId: receivedRequest._id };
    }

    return { status: "none" };
  },
});
