import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useAuth } from "./useAuth";

export type Card = {
  id: string;
  suit: "hearts" | "diamonds" | "clubs" | "spades";
  rank: "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10";
  playable: boolean;
};

export function useGame(gameId: string | null) {
  const { userId } = useAuth();
  const user = useQuery(
    api.users.getCurrentUser,
    userId ? { clerkUserId: userId } : "skip"
  );
  const myUserId = user?._id;

  const game = useQuery(
    api.games.getGame,
    gameId ? { gameId } : "skip"
  );

  const myHand = useQuery(
    api.games.getMyHand,
    gameId && myUserId
      ? { gameId, playerId: myUserId }
      : "skip"
  ) as Card[] | undefined;

  const currentPlays = useQuery(
    api.games.getPlaysByTurn,
    gameId && game?.currentRound
      ? { gameId, round: game.currentRound }
      : "skip"
  );

  const turnResults = useQuery(
    api.games.getTurnResults,
    gameId ? { gameId } : "skip"
  );

  const playCardMutation = useMutation(api.games.playCard);

  const isMyTurn = game?.currentTurnPlayerId === myUserId;
  
  const canPlayCard = (card: Card) => {
    if (!myHand || !game) return false;
    return card.playable === true;
  };

  const playCard = async (card: Card) => {
    if (!myUserId) {
      throw new Error("User not authenticated");
    }
    if (!gameId) {
      throw new Error("Game ID not found");
    }
    if (!canPlayCard(card)) {
      throw new Error("Cannot play this card");
    }
    return await playCardMutation({
      gameId,
      cardId: card.id,
      playerId: myUserId,
    });
  };

  return {
    match: game,
    game,
    myHand: myHand || [],
    currentPlays: currentPlays || [],
    turnResults: turnResults || [],
    playCard,
    isMyTurn: isMyTurn || false,
    canPlayCard,
    myUserId,
  };
}

