import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "./useAuth";
import { Id } from "@/convex/_generated/dataModel";
import { isValidPlay, type Card } from "@/convex/game";

export function useGame(matchId: Id<"matches">) {
  const { userId } = useAuth();
  const myUserId = userId ? (userId as any as Id<"users">) : null;

  const match = useQuery(api.matches.get, { matchId });
  const myHand = useQuery(
    api.matches.getMyHand,
    matchId && myUserId
      ? { matchId, playerId: myUserId }
      : "skip"
  ) as Card[] | undefined;

  const currentPlays = useQuery(
    api.matches.getPlaysByTurn,
    matchId && match?.currentTurn
      ? { matchId, turn: match.currentTurn }
      : "skip"
  );

  const turnResults = useQuery(
    api.matches.getTurnResults,
    matchId ? { matchId } : "skip"
  );

  const playCardMutation = useMutation(api.matches.playCard);

  const isMyTurn = match?.currentPlayerId === myUserId;
  const canPlayCard = (card: Card) => {
    if (!myHand) return false;
    return isValidPlay(myHand, card, match?.leadSuit || null);
  };

  const playCard = async (card: Card) => {
    if (!myUserId) {
      throw new Error("User not authenticated");
    }
    if (!canPlayCard(card)) {
      throw new Error("Cannot play this card");
    }
    return await playCardMutation({
      matchId,
      playerId: myUserId,
      card,
    });
  };

  return {
    match,
    myHand: myHand || [],
    currentPlays: currentPlays || [],
    turnResults: turnResults || [],
    playCard,
    isMyTurn: isMyTurn || false,
    canPlayCard,
  };
}

