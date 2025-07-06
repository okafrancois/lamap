"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  IconTrophy,
  IconCoin,
  IconDice,
  IconUsers,
  IconChartBar,
} from "@tabler/icons-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

import { useAuth } from "@/components/providers/auth-provider";

const GAME_STATUS_BADGES = {
  COMPLETED: { label: "Terminée", variant: "default" },
  CANCELLED: { label: "Annulée", variant: "destructive" },
} as const;

function GameHistoryCard({ game }: { game: any }) {
  const { user } = useAuth();
  const currentPlayer = null;
  const opponent = null;
  const isWinner = false;
  const status =
    GAME_STATUS_BADGES[game.status as keyof typeof GAME_STATUS_BADGES];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{game.gameType}</h3>
            <p className="text-muted-foreground text-sm">
              {new Date(game.createdAt).toLocaleDateString()}
            </p>
          </div>
          <Badge variant={status?.variant || "default"}>
            {status?.label || game.status}
          </Badge>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconCoin className="h-4 w-4" />
            <span>{game.stake} Koras</span>
          </div>
          <div className="flex items-center gap-2">
            <IconUsers className="h-4 w-4" />
            <span>{game.players.length} joueurs</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Adversaire</p>
            <p className="text-muted-foreground text-sm">{"Inconnu"}</p>
          </div>
          {game.status === "COMPLETED" && (
            <div className="text-right">
              {isWinner ? (
                <div className="flex items-center gap-2 text-green-500">
                  <IconTrophy className="h-5 w-5" />
                  <span className="font-bold">+{game.winnings} Koras</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-500">
                  <IconDice className="h-5 w-5" />
                  <span className="font-bold">-{game.stake} Koras</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function GameStats({ stats }: { stats: any }) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <IconDice className="h-4 w-4" />
            Parties jouées
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-2xl font-bold">{stats.totalGames}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <IconTrophy className="h-4 w-4 text-yellow-500" />
            Parties gagnées
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-2xl font-bold">{stats.gamesWon}</p>
          <Progress value={stats.winRate} className="mt-2" />
          <p className="text-muted-foreground mt-1 text-xs">
            {stats.winRate.toFixed(1)}% de victoires
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <IconCoin className="h-4 w-4" />
            Gains totaux
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-2xl font-bold">{stats.totalWinnings} Koras</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Plus gros gain : {stats.highestWin} Koras
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <IconChartBar className="h-4 w-4" />
            Jeu favori
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-2xl font-bold">{stats.favoriteGameType || "-"}</p>
          <p className="text-muted-foreground mt-1 text-xs">
            {stats.favoriteGameType && stats.gameTypes
              ? stats.gameTypes[stats.favoriteGameType] || 0
              : 0}{" "}
            parties
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function GamesHistoryPage() {
  const { user } = useAuth();
  const [games, setGames] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadGames();
      loadStats();
    }
  }, [user]);

  const loadGames = async () => {
    try {
      setLoading(true);
      const history = [] as any[];
      setGames(history);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du chargement de l'historique");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const gameStats = {
        totalGames: 0,
        gamesWon: 0,
        winRate: 0,
        totalWinnings: 0,
        highestWin: 0,
        favoriteGameType: null,
        gameTypes: {},
      };
      setStats(gameStats);
    } catch (error: any) {
      toast.error(
        error.message || "Erreur lors du chargement des statistiques",
      );
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-3xl font-bold">Historique des parties</h1>

      {stats && <GameStats stats={stats} />}

      <h2 className="mb-4 text-xl font-semibold">Parties récentes</h2>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : games.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Aucune partie à afficher</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {games.map((game) => (
            <GameHistoryCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </div>
  );
}
