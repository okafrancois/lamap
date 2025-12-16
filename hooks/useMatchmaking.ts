import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useAuth } from "./useAuth";

export function useMatchmaking() {
  const { userId } = useAuth();
  const user = useQuery(
    api.users.getCurrentUser,
    userId ? { clerkUserId: userId } : "skip"
  );
  const myUserId = user?._id;

  const queueStatus = useQuery(
    api.matchmaking.getMyStatus,
    myUserId ? { userId: myUserId } : "skip"
  );

  const joinQueue = useMutation(api.matchmaking.joinQueue);
  const leaveQueue = useMutation(api.matchmaking.leaveQueue);
  const createMatchVsAI = useMutation(api.matchmaking.createMatchVsAI);
  const setMatchReady = useMutation(api.matchmaking.setMatchReady);

  const handleJoinQueue = async (
    betAmount: number,
    currency: "EUR" | "XAF" = "XAF"
  ) => {
    if (!myUserId) {
      throw new Error("User not authenticated");
    }
    return await joinQueue({ userId: myUserId, betAmount, currency });
  };

  const handleLeaveQueue = async () => {
    if (!myUserId) {
      throw new Error("User not authenticated");
    }
    return await leaveQueue({ userId: myUserId });
  };

  const handleCreateMatchVsAI = async (
    betAmount: number,
    difficulty: "easy" | "medium" | "hard",
    currency: "EUR" | "XAF" = "XAF"
  ) => {
    if (!myUserId) {
      throw new Error("User not authenticated");
    }
    return await createMatchVsAI({
      playerId: myUserId,
      betAmount,
      difficulty,
      currency,
    });
  };

  const handleSetMatchReady = async (gameId: string) => {
    if (!myUserId) {
      throw new Error("User not authenticated");
    }
    return await setMatchReady({ gameId, playerId: myUserId });
  };

  return {
    status: queueStatus?.status || "idle",
    opponent: queueStatus?.opponent,
    gameId: queueStatus?.gameId,
    match: queueStatus?.game,
    betAmount: queueStatus?.betAmount,
    joinedAt: queueStatus?.joinedAt,
    joinQueue: handleJoinQueue,
    leaveQueue: handleLeaveQueue,
    createMatchVsAI: handleCreateMatchVsAI,
    setMatchReady: handleSetMatchReady,
    timeInQueue: queueStatus?.joinedAt ? Date.now() - queueStatus.joinedAt : 0,
  };
}
