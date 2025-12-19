import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useEffect, useState } from "react";

export function useGameTimer(
  gameId: string | undefined,
  currentPlayerId: string | null | undefined
) {
  const timers = useQuery(
    api.timer.getGameTimers,
    gameId ? { gameId } : "skip"
  );

  const [localTimeRemaining, setLocalTimeRemaining] = useState<number>(0);

  useEffect(() => {
    if (!timers?.enabled || !currentPlayerId) {
      setLocalTimeRemaining(0);
      return;
    }

    const playerTimer = timers.timers.find(
      (t) => t.playerId === currentPlayerId
    );
    if (playerTimer) {
      setLocalTimeRemaining(playerTimer.timeRemaining);
    }
  }, [timers, currentPlayerId]);

  // Décompte local pour une UI fluide
  useEffect(() => {
    if (!timers?.enabled || !currentPlayerId) return;

    const interval = setInterval(() => {
      setLocalTimeRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [timers?.enabled, currentPlayerId]);

  return {
    enabled: timers?.enabled || false,
    timeRemaining: localTimeRemaining,
    totalTime: timers?.timerDuration || 60,
    currentTurnPlayerId: timers?.currentTurnPlayerId,
    timers: timers?.timers || [],
  };
}
