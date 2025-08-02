"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconTrophy,
  IconTarget,
  IconSword,
  IconCoins,
  IconRobot,
  IconUsers,
  IconFlame,
  IconStar,
} from "@tabler/icons-react";
import { useGameStats } from "@/hooks/use-game-stats";

export function StatsCards() {
  const { stats, winRate, totalKorasBalance, isLoading } = useGameStats();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="mb-1 h-8 w-16" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Parties jouées",
      value: stats?.totalGames || 0,
      description: "Total des parties",
      icon: IconTarget,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Taux de victoire",
      value: `${winRate}%`,
      description: `${stats?.wins || 0} victoires`,
      icon: IconTrophy,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      title: "Koras actuels",
      value: stats?.currentKoras || 0,
      description:
        totalKorasBalance >= 0
          ? `+${totalKorasBalance} total`
          : `${totalKorasBalance} total`,
      icon: IconCoins,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Vs IA",
      value: stats?.aiWins || 0,
      description: "Victoires contre IA",
      icon: IconRobot,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Koras simples",
      value: stats?.simpleKoras || 0,
      description: "Exploits x2",
      icon: IconStar,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Koras doubles",
      value: stats?.doubleKoras || 0,
      description: "Exploits x3",
      icon: IconFlame,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      title: "Koras triples",
      value: stats?.tripleKoras || 0,
      description: "Exploits x4",
      icon: IconSword,
      color: "text-pink-600",
      bgColor: "bg-pink-100",
    },
    {
      title: "Auto-victoires",
      value: stats?.autoVictories || 0,
      description: "Victoires spéciales",
      icon: IconUsers,
      color: "text-cyan-600",
      bgColor: "bg-cyan-100",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => {
        const IconComponent = stat.icon;
        return (
          <Card key={stat.title} className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                <IconComponent className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-muted-foreground text-xs">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
