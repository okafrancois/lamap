"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { IconTrendingUp, IconChartLine } from "@tabler/icons-react";
import { useGameStats } from "@/hooks/use-game-stats";
import { format, subDays, isAfter } from "date-fns";
import { fr } from "date-fns/locale";

export function PerformanceChart() {
  const { history, isLoading } = useGameStats();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconChartLine className="h-5 w-5" />
            Performance des 7 derniers jours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Préparer les données des 7 derniers jours
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    return {
      date: format(date, "dd/MM"),
      fullDate: date,
      games: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      korasBalance: 0,
    };
  });

  // Remplir avec les données réelles
  history.forEach((game) => {
    const gameDate = new Date(game.endedAt!);
    const dayData = last7Days.find(
      (day) =>
        format(day.fullDate, "yyyy-MM-dd") === format(gameDate, "yyyy-MM-dd"),
    );

    if (dayData) {
      dayData.games++;
      if (game.isWinner) {
        dayData.wins++;
        dayData.korasBalance += game.currentBet;
      } else {
        dayData.losses++;
        dayData.korasBalance -= game.currentBet;
      }
      dayData.winRate =
        dayData.games > 0 ? (dayData.wins / dayData.games) * 100 : 0;
    }
  });

  // Calculer les tendances
  const totalGames = last7Days.reduce((sum, day) => sum + day.games, 0);
  const totalBalance = last7Days.reduce(
    (sum, day) => sum + day.korasBalance,
    0,
  );
  const avgWinRate =
    totalGames > 0
      ? Math.round(
          (last7Days.reduce((sum, day) => sum + day.wins, 0) / totalGames) *
            100,
        )
      : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background rounded-lg border p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          <div className="mt-2 space-y-1">
            <p className="text-sm">
              <span className="text-blue-600">●</span> Parties: {data.games}
            </p>
            <p className="text-sm">
              <span className="text-green-600">●</span> Victoires: {data.wins}
            </p>
            <p className="text-sm">
              <span className="text-red-600">●</span> Défaites: {data.losses}
            </p>
            <p className="text-sm">
              <span className="text-purple-600">●</span> Taux:{" "}
              {Math.round(data.winRate)}%
            </p>
            <p className="text-sm">
              <span className="text-orange-600">●</span> Balance:{" "}
              {data.korasBalance > 0 ? "+" : ""}
              {data.korasBalance}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (totalGames === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconChartLine className="h-5 w-5" />
            Performance des 7 derniers jours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground py-12 text-center">
            <IconTrendingUp className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>Aucune partie cette semaine</p>
            <p className="text-sm">
              Jouez quelques parties pour voir vos performances !
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
          <IconChartLine className="h-5 w-5" />
          Performance des 7 derniers jours
          <div className="ml-auto flex gap-2">
            <Badge variant="outline">
              {totalGames} partie{totalGames > 1 ? "s" : ""}
            </Badge>
            <Badge variant={avgWinRate >= 50 ? "default" : "secondary"}>
              {avgWinRate}% victoires
            </Badge>
            <Badge variant={totalBalance >= 0 ? "default" : "destructive"}>
              {totalBalance > 0 ? "+" : ""}
              {totalBalance} koras
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Graphique du taux de victoire */}
          <div>
            <h4 className="text-muted-foreground mb-3 text-sm font-medium">
              Taux de victoire journalier
            </h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="date"
                  className="text-xs"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  domain={[0, 100]}
                  className="text-xs"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="winRate"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ fill: "#22c55e", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Graphique de la balance des koras */}
          <div>
            <h4 className="text-muted-foreground mb-3 text-sm font-medium">
              Balance quotidienne des koras
            </h4>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="date"
                  className="text-xs"
                  tick={{ fontSize: 12 }}
                />
                <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="korasBalance"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
