"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LibButton } from "@/components/library/button";
import {
  IconClock,
  IconPlayCard,
  IconRobot,
  IconUsers,
  IconRefresh,
} from "@tabler/icons-react";
import { useGameResume } from "@/hooks/use-game-resume";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface ResumeGameCardProps {
  onGameResumed?: () => void;
}

export function ResumeGameCard({ onGameResumed }: ResumeGameCardProps) {
  const { ongoingGames, isLoadingGames, resumeGame, isResuming, refetch } =
    useGameResume();

  if (isLoadingGames) {
    return (
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <IconClock className="h-5 w-5 animate-pulse" />
            Recherche de parties en cours...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!ongoingGames.length) {
    return null; // Pas de carte si aucune partie en cours
  }

  const handleResume = async (gameId: string) => {
    const success = await resumeGame(gameId);
    if (success) {
      onGameResumed?.();
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-blue-800">
          <div className="flex items-center gap-2">
            <IconClock className="h-5 w-5" />
            Parties en cours
            <Badge variant="secondary">{ongoingGames.length}</Badge>
          </div>
          <LibButton
            variant="ghost"
            size="sm"
            onClick={() => void refetch()}
            className="text-blue-600 hover:text-blue-700"
          >
            <IconRefresh className="h-4 w-4" />
          </LibButton>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {ongoingGames.map((game) => (
          <div
            key={game.gameId}
            className="flex items-center justify-between rounded-lg border border-blue-200 bg-white p-3"
          >
            <div className="flex items-center gap-3">
              {/* Icône du mode */}
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                {game.mode === "AI" ? (
                  <IconRobot className="h-4 w-4 text-blue-600" />
                ) : (
                  <IconUsers className="h-4 w-4 text-blue-600" />
                )}
              </div>

              {/* Infos de la partie */}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    vs {game.opponent?.name || "IA"}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    Tour {game.currentRound}/{game.maxRounds}
                  </Badge>
                </div>
                <div className="text-muted-foreground text-sm">
                  {formatDistanceToNow(new Date(game.startedAt), {
                    addSuffix: true,
                    locale: fr,
                  })}{" "}
                  • Mise: {game.currentBet} koras
                  {game.aiDifficulty && ` • ${game.aiDifficulty}`}
                </div>
              </div>
            </div>

            {/* Bouton reprendre */}
            <LibButton
              onClick={() => handleResume(game.gameId)}
              disabled={isResuming}
              size="sm"
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <IconPlayCard className="mr-2 h-4 w-4" />
              {isResuming ? "Chargement..." : "Reprendre"}
            </LibButton>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
