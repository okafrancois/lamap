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
  IconCalendar,
} from "@tabler/icons-react";
import { useGameResume } from "@/hooks/use-game-resume";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useRouter } from "next/navigation";

export function OngoingGames() {
  const { ongoingGames, isLoadingGames, resumeGame, isResuming, refetch } =
    useGameResume();
  const router = useRouter();

  const handleResume = async (gameId: string) => {
    const success = await resumeGame(gameId);
    if (success) {
      // Rediriger vers la page de jeu
      router.push("/play");
    }
  };

  if (isLoadingGames) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconClock className="h-5 w-5 animate-pulse" />
            Parties en cours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Recherche en cours...</p>
        </CardContent>
      </Card>
    );
  }

  if (!ongoingGames.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconClock className="h-5 w-5" />
            Parties en cours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground py-8 text-center">
            <IconCalendar className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>Aucune partie en cours</p>
            <p className="text-sm">Toutes vos parties sont terminées !</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconClock className="h-5 w-5" />
            Parties en cours
            <Badge variant="secondary">
              {ongoingGames.length} partie{ongoingGames.length > 1 ? "s" : ""}
            </Badge>
          </div>
          <LibButton variant="ghost" size="sm" onClick={() => void refetch()}>
            <IconRefresh className="h-4 w-4" />
          </LibButton>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {ongoingGames.map((game) => (
          <div
            key={game.gameId}
            className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-4 transition-colors"
          >
            <div className="flex items-center gap-3">
              {/* Icône du mode */}
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                {game.mode === "AI" ? (
                  <IconRobot className="h-5 w-5 text-blue-600" />
                ) : (
                  <IconUsers className="h-5 w-5 text-blue-600" />
                )}
              </div>

              {/* Infos de la partie */}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    vs {game.opponent?.name || "IA"}
                  </span>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs">
                      Tour {game.currentRound}/{game.maxRounds}
                    </Badge>
                    {game.mode === "AI" && game.aiDifficulty && (
                      <Badge variant="secondary" className="text-xs">
                        {game.aiDifficulty}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-muted-foreground text-sm">
                  Commencée{" "}
                  {formatDistanceToNow(new Date(game.startedAt), {
                    addSuffix: true,
                    locale: fr,
                  })}{" "}
                  • Mise: {game.currentBet} koras
                </div>
              </div>
            </div>

            {/* Bouton reprendre */}
            <div className="space-y-1 text-right">
              <LibButton
                onClick={() => handleResume(game.gameId)}
                disabled={isResuming}
                size="sm"
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                <IconPlayCard className="mr-2 h-4 w-4" />
                {isResuming ? "Chargement..." : "Reprendre"}
              </LibButton>
              <div className="text-muted-foreground text-xs">
                ID: {game.gameId.slice(-8)}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
