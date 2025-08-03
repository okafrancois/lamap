"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconTrophy,
  IconSkull,
  IconRobot,
  IconUsers,
  IconClock,
  IconCoins,
  IconCalendar,
} from "@tabler/icons-react";
import { useGameStats } from "@/hooks/use-game-stats";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export function GameHistory() {
  const { history, isLoading } = useGameStats();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconClock className="h-5 w-5" />
            Historique des parties
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <div className="space-y-1 text-right">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const getVictoryTypeInfo = (victoryType: string) => {
    switch (victoryType) {
      case "SIMPLE_KORA":
        return {
          label: "Kora Simple",
          color: "bg-yellow-100 text-yellow-800",
          multiplier: "x2",
        };
      case "DOUBLE_KORA":
        return {
          label: "Double Kora",
          color: "bg-orange-100 text-orange-800",
          multiplier: "x3",
        };
      case "TRIPLE_KORA":
        return {
          label: "Triple Kora",
          color: "bg-red-100 text-red-800",
          multiplier: "x4",
        };
      case "AUTO_SUM":
        return {
          label: "Auto-Somme",
          color: "bg-purple-100 text-purple-800",
          multiplier: "x1",
        };
      case "AUTO_LOWEST":
        return {
          label: "Auto-Minimum",
          color: "bg-purple-100 text-purple-800",
          multiplier: "x1",
        };
      case "AUTO_SEVENS":
        return {
          label: "3x Sept",
          color: "bg-green-100 text-green-800",
          multiplier: "x1",
        };
      default:
        return {
          label: "Normal",
          color: "bg-gray-100 text-gray-800",
          multiplier: "x1",
        };
    }
  };

  if (!history.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconClock className="h-5 w-5" />
            Historique des parties
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground py-8 text-center">
            <IconCalendar className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>Aucune partie terminée</p>
            <p className="text-sm">
              Commencez à jouer pour voir votre historique !
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconClock className="h-5 w-5" />
          Historique des parties
          <Badge variant="secondary" className="ml-auto">
            {history.length} partie{history.length > 1 ? "s" : ""}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {history.slice(0, 5).map((game) => {
          const victoryInfo = getVictoryTypeInfo(game.victoryType ?? "NORMAL");
          const isWinner = game.winnerPlayerId === game.player1.username;

          return (
            <div
              key={game.gameId}
              className={`hover:bg-muted/50 flex items-center justify-between rounded-lg border p-4 transition-colors ${
                isWinner
                  ? "border-green-200 bg-green-50/50"
                  : "border-red-200 bg-red-50/50"
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Icône de résultat */}
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    isWinner
                      ? "bg-green-100 text-green-600"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {isWinner ? (
                    <IconTrophy className="h-5 w-5" />
                  ) : (
                    <IconSkull className="h-5 w-5" />
                  )}
                </div>

                {/* Informations de la partie */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {isWinner ? "Victoire" : "Défaite"}
                    </span>
                    <div className="text-muted-foreground flex items-center gap-1">
                      {game.mode === "AI" ? (
                        <IconRobot className="h-4 w-4" />
                      ) : (
                        <IconUsers className="h-4 w-4" />
                      )}
                      <span className="text-sm">
                        vs{" "}
                        {game.player2?.name ?? game.player2?.username ?? "IA"}
                      </span>
                    </div>
                  </div>

                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <span>
                      {formatDistanceToNow(new Date(game.endedAt ?? ""), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </span>
                    {game.victoryType && game.victoryType !== "NORMAL" && (
                      <Badge
                        variant="secondary"
                        className={`text-xs ${victoryInfo.color}`}
                      >
                        {victoryInfo.label} {victoryInfo.multiplier}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Mise et gain */}
              <div className="space-y-1 text-right">
                <div className="flex items-center gap-1">
                  <IconCoins className="text-muted-foreground h-4 w-4" />
                  <span
                    className={`font-medium ${
                      isWinner ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {isWinner ? "+" : "-"}
                    {game.currentBet}
                  </span>
                </div>
                <div className="text-muted-foreground text-xs">
                  Mise: {game.currentBet}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
