import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "./useAuth";
import { Id } from "@/convex/_generated/dataModel";

export function useMatchmaking() {
  const { userId } = useAuth();
  const user = useQuery(
    api.users.getCurrentUser,
    userId ? { clerkId: userId } : "skip"
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

  const handleJoinQueue = async (betAmount: number) => {
    if (!myUserId) {
      throw new Error("User not authenticated");
    }
    return await joinQueue({ userId: myUserId, betAmount });
  };

  const handleLeaveQueue = async () => {
    if (!myUserId) {
      throw new Error("User not authenticated");
    }
    return await leaveQueue({ userId: myUserId });
  };

  const handleCreateMatchVsAI = async (
    betAmount: number,
    difficulty: string
  ) => {
    if (!myUserId) {
      throw new Error("User not authenticated");
    }
    return await createMatchVsAI({
      playerId: myUserId,
      betAmount,
      difficulty,
    });
  };

  const handleSetMatchReady = async (matchId: Id<"matches">) => {
    if (!myUserId) {
      throw new Error("User not authenticated");
    }
    return await setMatchReady({ matchId, playerId: myUserId });
  };

  return {
    status: queueStatus?.status || "idle",
    opponent: queueStatus?.opponent,
    matchId: queueStatus?.matchId,
    match: queueStatus?.match,
    betAmount: queueStatus?.betAmount,
    joinedAt: queueStatus?.joinedAt,
    joinQueue: handleJoinQueue,
    leaveQueue: handleLeaveQueue,
    createMatchVsAI: handleCreateMatchVsAI,
    setMatchReady: handleSetMatchReady,
    timeInQueue: queueStatus?.joinedAt
      ? Date.now() - queueStatus.joinedAt
      : 0,
  };
}

