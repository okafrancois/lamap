import { v } from "convex/values";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { aiSelectCard, type Difficulty } from "./ai";
import { calculateWinnings } from "./economy";
import {
  calculateKoraMultiplier,
  checkAutoWin,
  dealCards,
  generateDeck,
  getTurnWinner,
  isValidPlay,
  type Card,
} from "./game";

export const get = query({
  args: { matchId: v.id("matches") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.matchId);
  },
});

export const getActiveMatch = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      return null;
    }

    const runningMatch = await ctx.db
      .query("matches")
      .withIndex("by_status", (q) => q.eq("status", "playing"))
      .filter((q) =>
        q.or(
          q.eq(q.field("player1Id"), user._id),
          q.eq(q.field("player2Id"), user._id)
        )
      )
      .first();

    if (runningMatch) return runningMatch;

    const readyMatch = await ctx.db
      .query("matches")
      .withIndex("by_status", (q) => q.eq("status", "ready"))
      .filter((q) =>
        q.or(
          q.eq(q.field("player1Id"), user._id),
          q.eq(q.field("player2Id"), user._id)
        )
      )
      .first();

    if (readyMatch) return readyMatch;

    return null;
  },
});

export const startMatch = mutation({
  args: { matchId: v.id("matches") },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    if (match.status !== "ready") {
      throw new Error("Match is not ready to start");
    }

    const deck = generateDeck();
    const { hand1, hand2 } = dealCards(deck);

    const autoWin1 = checkAutoWin(hand1);
    const autoWin2 = checkAutoWin(hand2);

    if (autoWin1) {
      const totalBet = match.betAmount * 2;
      const { winnings } = calculateWinnings(totalBet, 1);

      const winner = await ctx.db.get(match.player1Id);
      const loserId = match.player2Id || match.player1Id;
      const loser = await ctx.db.get(loserId);

      if (winner) {
        await ctx.db.patch(match.player1Id, {
          koraBalance: winner.koraBalance + winnings,
          totalWins: winner.totalWins + 1,
          totalKoraWon: winner.totalKoraWon + winnings,
        });

        await ctx.db.insert("transactions", {
          userId: match.player1Id,
          type: "win",
          amount: winnings,
          matchId: args.matchId,
          description: `Gain de ${winnings} Kora (${autoWin1})`,
          createdAt: Date.now(),
        });
      }

      if (loser && !match.isVsAI) {
        await ctx.db.patch(loserId, {
          totalLosses: loser.totalLosses + 1,
        });
      }

      await ctx.db.patch(args.matchId, {
        status: "finished",
        winnerId: match.player1Id,
        winType: autoWin1,
        koraMultiplier: 1,
        finishedAt: Date.now(),
      });
      return { autoWin: true, winner: match.player1Id, winType: autoWin1 };
    }

    if (autoWin2) {
      const winnerId = match.isVsAI ? match.player1Id : match.player2Id!;
      const totalBet = match.betAmount * 2;
      const { winnings } = calculateWinnings(totalBet, 1);

      const winner = await ctx.db.get(winnerId);
      const loserId =
        match.player1Id === winnerId ? match.player2Id! : match.player1Id;
      const loser = await ctx.db.get(loserId);

      if (winner) {
        await ctx.db.patch(winnerId, {
          koraBalance: winner.koraBalance + winnings,
          totalWins: winner.totalWins + 1,
          totalKoraWon: winner.totalKoraWon + winnings,
        });

        await ctx.db.insert("transactions", {
          userId: winnerId,
          type: "win",
          amount: winnings,
          matchId: args.matchId,
          description: `Gain de ${winnings} Kora (${autoWin2})`,
          createdAt: Date.now(),
        });
      }

      if (loser && !match.isVsAI) {
        await ctx.db.patch(loserId, {
          totalLosses: loser.totalLosses + 1,
        });
      }

      await ctx.db.patch(args.matchId, {
        status: "finished",
        winnerId,
        winType: autoWin2,
        koraMultiplier: 1,
        finishedAt: Date.now(),
      });
      return { autoWin: true, winner: winnerId, winType: autoWin2 };
    }

    await ctx.db.insert("hands", {
      matchId: args.matchId,
      playerId: match.player1Id,
      cards: hand1,
    });

    if (match.isVsAI) {
      if (!match.player2Id) {
        // Migration fallback/Safety
        const aiPlayerId = match.player1Id;
         await ctx.db.insert("hands", {
          matchId: args.matchId,
          playerId: aiPlayerId,
          cards: hand2,
        });
      } else {
        await ctx.db.insert("hands", {
          matchId: args.matchId,
          playerId: match.player2Id,
          cards: hand2,
        });
      }
    } else {
      await ctx.db.insert("hands", {
        matchId: args.matchId,
        playerId: match.player2Id!,
        cards: hand2,
      });
    }

    await ctx.db.patch(args.matchId, {
      status: "playing",
      currentTurn: 1,
      currentPlayerId: match.player1Id,
    });

    if (match.isVsAI) {
      await ctx.scheduler.runAfter(500, api.matches.playAICard, {
        matchId: args.matchId,
      });
    }

    return { autoWin: false };
  },
});

export const playCard = mutation({
  args: {
    matchId: v.id("matches"),
    playerId: v.id("users"),
    card: v.object({
      suit: v.string(),
      value: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    if (match.status !== "playing") {
      throw new Error("Match is not in playing state");
    }

    if (match.currentPlayerId !== args.playerId) {
      throw new Error("Not your turn");
    }

    const hand = await ctx.db
      .query("hands")
      .withIndex("by_match", (q) => q.eq("matchId", args.matchId))
      .filter((q) => q.eq(q.field("playerId"), args.playerId))
      .first();

    if (!hand) {
      throw new Error("Hand not found");
    }

    const cardToPlay: Card = {
      suit: args.card.suit as Card["suit"],
      value: args.card.value,
    };

    if (
      !isValidPlay(hand.cards as Card[], cardToPlay, match.leadSuit || null)
    ) {
      throw new Error("Invalid card play");
    }

    const cardIndex = hand.cards.findIndex(
      (c) => c.suit === cardToPlay.suit && c.value === cardToPlay.value
    );

    if (cardIndex === -1) {
      throw new Error("Card not in hand");
    }

    const updatedCards = [...hand.cards];
    updatedCards.splice(cardIndex, 1);

    await ctx.db.patch(hand._id, {
      cards: updatedCards,
    });

    const leadSuit =
      match.currentTurn === 1 ? cardToPlay.suit : match.leadSuit!;

    await ctx.db.insert("plays", {
      matchId: args.matchId,
      turn: match.currentTurn,
      playerId: args.playerId,
      card: cardToPlay,
      playedAt: Date.now(),
    });

    const plays = await ctx.db
      .query("plays")
      .withIndex("by_match_turn", (q) =>
        q.eq("matchId", args.matchId).eq("turn", match.currentTurn)
      )
      .collect();

    // Check if this is the first play of the turn
    if (plays.length === 1) {
      // First play of the turn
      // Determine next player.
      const nextPlayerId =
         match.player1Id === args.playerId ? match.player2Id! : match.player1Id;

      await ctx.db.patch(args.matchId, {
        leadSuit: cardToPlay.suit,
        currentPlayerId: nextPlayerId,
      });

      if (match.isVsAI && nextPlayerId === match.player2Id) {
        await ctx.scheduler.runAfter(500, api.matches.playAICard, {
          matchId: args.matchId,
        });
      }
    } else if (plays.length === 2) {
      // Second play of the turn - Resolve the turn
      const play1 = {
        playerId: plays[0].playerId,
        card: plays[0].card as Card,
      };
      const play2 = {
        playerId: plays[1].playerId,
        card: plays[1].card as Card,
      };

      // Use match.leadSuit directly. It should be set by the first player.
      const winner = getTurnWinner(play1, play2, match.leadSuit!);

      await ctx.db.insert("turnResults", {
        matchId: args.matchId,
        turn: match.currentTurn,
        winnerId: winner.playerId as Id<"users">,
        winningCard: winner.card,
      });

      const isLastTurn = match.currentTurn === 5;
      if (isLastTurn) {
        // End of match logic
        const turnResults = await ctx.db
          .query("turnResults")
          .withIndex("by_match", (q) => q.eq("matchId", args.matchId))
          .collect();

        const finalWinner = turnResults[turnResults.length - 1].winnerId;
        const multiplier = calculateKoraMultiplier(
          turnResults.map((tr) => ({
            turn: tr.turn,
            winnerId: tr.winnerId,
            winningCard: tr.winningCard as Card,
          }))
        );

        let winType = "normal";
        if (multiplier > 1) {
          if (multiplier === 8) winType = "triple_kora";
          else if (multiplier === 4) winType = "double_kora";
          else if (multiplier === 2) winType = "kora";
        }

        const totalBet = match.betAmount * 2;
        const { winnings } = calculateWinnings(totalBet, multiplier);

        const winner = await ctx.db.get(finalWinner);
        const loserId =
          match.player1Id === finalWinner ?
            match.player2Id!
          : match.player1Id;
        const loser = await ctx.db.get(loserId);

        if (winner) {
          await ctx.db.patch(finalWinner, {
            koraBalance: winner.koraBalance + winnings,
            totalWins: winner.totalWins + 1,
            totalKoraWon: winner.totalKoraWon + winnings,
          });

          await ctx.db.insert("transactions", {
            userId: finalWinner,
            type: "win",
            amount: winnings,
            matchId: args.matchId,
            description: `Gain de ${winnings} Kora (${winType})`,
            createdAt: Date.now(),
          });
        }

        if (loser && !match.isVsAI) {
          await ctx.db.patch(loserId, {
            totalLosses: loser.totalLosses + 1,
          });
        }

        await ctx.db.patch(args.matchId, {
          status: "finished",
          winnerId: finalWinner,
          winType,
          koraMultiplier: multiplier,
          finishedAt: Date.now(),
        });
      } else {
        // Prepare for next turn
        await ctx.db.patch(args.matchId, {
          currentTurn: match.currentTurn + 1,
          currentPlayerId: winner.playerId as Id<"users">,
          leadSuit: undefined,
        });

        if (match.isVsAI && winner.playerId === match.player2Id) {
          await ctx.scheduler.runAfter(500, api.matches.playAICard, {
            matchId: args.matchId,
          });
        }
      }
    }
    return { success: true };
  },
});

export const playAICard = mutation({
  args: {
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match || !match.isVsAI) {
      return;
    }

    if (match.status !== "playing") {
      return;
    }

    const aiPlayerId = match.player2Id || match.player1Id; // Use player2Id if available
    if (match.currentPlayerId !== aiPlayerId) {
      return;
    }

    const aiHand = await ctx.db
      .query("hands")
      .withIndex("by_match", (q) => q.eq("matchId", args.matchId))
      .filter((q) => q.eq(q.field("playerId"), aiPlayerId))
      .first();

    if (!aiHand || aiHand.cards.length === 0) {
      return;
    }

    const turnResults = await ctx.db
      .query("turnResults")
      .withIndex("by_match", (q) => q.eq("matchId", args.matchId))
      .collect();

    const gameHistory = turnResults.map((tr) => ({
      turn: tr.turn,
      winnerId: tr.winnerId,
      winningCard: tr.winningCard as Card,
    }));

    const difficulty = (match.aiDifficulty || "medium") as Difficulty;
    const selectedCard = aiSelectCard(
      aiHand.cards as Card[],
      match.leadSuit || null,
      match.currentTurn,
      difficulty,
      gameHistory
    );

    const cardIndex = aiHand.cards.findIndex(
      (c) => c.suit === selectedCard.suit && c.value === selectedCard.value
    );

    if (cardIndex === -1) {
      return;
    }

    const updatedCards = [...aiHand.cards];
    updatedCards.splice(cardIndex, 1);

    await ctx.db.patch(aiHand._id, {
      cards: updatedCards,
    });

    const leadSuit =
      match.currentTurn === 1 ? selectedCard.suit : match.leadSuit!;

    await ctx.db.insert("plays", {
      matchId: args.matchId,
      turn: match.currentTurn,
      playerId: aiPlayerId,
      card: selectedCard,
      playedAt: Date.now(),
    });

    const plays = await ctx.db
      .query("plays")
      .withIndex("by_match_turn", (q) =>
        q.eq("matchId", args.matchId).eq("turn", match.currentTurn)
      )
      .collect();

    if (plays.length === 1) {
      // AI played the first card of the turn
      await ctx.db.patch(args.matchId, {
        leadSuit: selectedCard.suit,
        currentPlayerId: match.player1Id, // Switch to player
      });
    } else if (plays.length === 2) {
      // AI played the second card -> Resolve Turn
      const play1 = {
        playerId: plays[0].playerId,
        card: plays[0].card as Card,
      };
      const play2 = {
        playerId: plays[1].playerId,
        card: plays[1].card as Card,
      };

      const winner = getTurnWinner(play1, play2, leadSuit);

      await ctx.db.insert("turnResults", {
        matchId: args.matchId,
        turn: match.currentTurn,
        winnerId: winner.playerId as Id<"users">,
        winningCard: winner.card,
      });

      const isLastTurn = match.currentTurn === 5;
      if (isLastTurn) {
        // End of match logic
        const turnResults = await ctx.db
          .query("turnResults")
          .withIndex("by_match", (q) => q.eq("matchId", args.matchId))
          .collect();

        const finalWinner = turnResults[turnResults.length - 1].winnerId;
        const multiplier = calculateKoraMultiplier(
          turnResults.map((tr) => ({
            turn: tr.turn,
            winnerId: tr.winnerId,
            winningCard: tr.winningCard as Card,
          }))
        );

        let winType = "normal";
        if (multiplier > 1) {
          if (multiplier === 8) winType = "triple_kora";
          else if (multiplier === 4) winType = "double_kora";
          else if (multiplier === 2) winType = "kora";
        }

        const totalBet = match.betAmount * 2;
        const { winnings } = calculateWinnings(totalBet, multiplier);

        const winner = await ctx.db.get(finalWinner);
        const loserId =
          match.player1Id === finalWinner ?
            match.player2Id!
          : match.player1Id;
        const loser = await ctx.db.get(loserId);

        if (winner) {
          await ctx.db.patch(finalWinner, {
            koraBalance: winner.koraBalance + winnings,
            totalWins: winner.totalWins + 1,
            totalKoraWon: winner.totalKoraWon + winnings,
          });

          await ctx.db.insert("transactions", {
            userId: finalWinner,
            type: "win",
            amount: winnings,
            matchId: args.matchId,
            description: `Gain de ${winnings} Kora (${winType})`,
            createdAt: Date.now(),
          });
        }

        if (loser && !match.isVsAI) {
          await ctx.db.patch(loserId, {
            totalLosses: loser.totalLosses + 1,
          });
        }

        await ctx.db.patch(args.matchId, {
          status: "finished",
          winnerId: finalWinner,
          winType,
          koraMultiplier: multiplier,
          finishedAt: Date.now(),
        });
      } else {
        // Prepare next turn
        await ctx.db.patch(args.matchId, {
          currentTurn: match.currentTurn + 1,
          currentPlayerId: winner.playerId as Id<"users">,
          leadSuit: undefined,
        });

        if (match.isVsAI && winner.playerId === match.player2Id) {
          await ctx.scheduler.runAfter(500, api.matches.playAICard, {
            matchId: args.matchId,
          });
        }
      }
    }

    return { success: true };
  },
});

export const getMyHand = query({
  args: {
    matchId: v.id("matches"),
    playerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const hand = await ctx.db
      .query("hands")
      .withIndex("by_match", (q) => q.eq("matchId", args.matchId))
      .filter((q) => q.eq(q.field("playerId"), args.playerId))
      .first();

    return hand?.cards || [];
  },
});

export const getPlaysByTurn = query({
  args: {
    matchId: v.id("matches"),
    turn: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("plays")
      .withIndex("by_match_turn", (q) =>
        q.eq("matchId", args.matchId).eq("turn", args.turn)
      )
      .collect();
  },
});

export const getTurnResults = query({
  args: { matchId: v.id("matches") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("turnResults")
      .withIndex("by_match", (q) => q.eq("matchId", args.matchId))
      .collect();
  },
});
