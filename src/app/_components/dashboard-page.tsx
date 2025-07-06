"use client";

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  IconCoin,
  IconTrophy,
  IconCards,
  IconChartBar,
} from "@tabler/icons-react";
import Link from "next/link";
import type { GameRoom, RoomPlayer } from "@prisma/client";
import { useAuth } from "@/components/providers/auth-provider";
import { useUserStats } from "@/hooks/use-user-data";

interface GameRoomWithPlayers extends GameRoom {
  players: RoomPlayer[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const userStats = useUserStats();
  const [activeRooms, setActiveRooms] = useState<GameRoomWithPlayers[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;

      try {
        // Charger les salles actives
        const rooms = [] as GameRoomWithPlayers[];
        setActiveRooms(
          rooms.filter(
            (r) => r.status === "WAITING" || r.status === "IN_PROGRESS",
          ),
        );
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      }
    };

    void loadDashboardData();
  }, [user]);

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* En-tête avec solde */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground">Bienvenue, {user?.username} !</p>
        </div>
        <Card className="border-primary">
          <CardContent className="flex items-center gap-4 p-4">
            <IconCoin className="text-primary h-8 w-8" />
            <div>
              <p className="text-muted-foreground text-sm">Solde</p>
              <p className="text-2xl font-bold">{user?.koras ?? 0} Koras</p>
            </div>
            <Link href="/koras">
              <Button size="sm">Recharger</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard
          icon={IconCards}
          title="Parties jouées"
          value={userStats?.totalGames ?? 0}
          description="Total de parties"
        />
        <StatCard
          icon={IconTrophy}
          title="Victoires"
          value={userStats?.totalWins ?? 0}
          description={`${userStats?.winRate.toFixed(1) ?? "0.0"}% de victoires`}
        />
        <StatCard
          icon={IconChartBar}
          title="Classement"
          value={`#${Math.max(1, 100 - (userStats?.totalWins ?? 0) * 5)}`}
          description="Position nationale"
        />
        <StatCard
          icon={IconCoin}
          title="Gains totaux"
          value={`${(userStats?.totalWins ?? 0) * 90} K`}
          description="Koras gagnés"
        />
      </div>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
          <CardDescription>Commencez une nouvelle partie</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Link href="/games/garame/create">
            <Button variant="outline" className="h-24 w-full flex-col gap-2">
              <IconCards className="h-8 w-8" />
              <span>Créer une partie</span>
            </Button>
          </Link>
          <Link href="/games/garame/lobby">
            <Button variant="outline" className="h-24 w-full flex-col gap-2">
              <IconTrophy className="h-8 w-8" />
              <span>Rejoindre une partie</span>
            </Button>
          </Link>
          <Link href="/koras">
            <Button variant="outline" className="h-24 w-full flex-col gap-2">
              <IconCoin className="h-8 w-8" />
              <span>Acheter des Koras</span>
            </Button>
          </Link>
          <Link href="/games/history">
            <Button variant="outline" className="h-24 w-full flex-col gap-2">
              <IconChartBar className="h-8 w-8" />
              <span>Historique</span>
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Parties actives */}
      {activeRooms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Parties actives</CardTitle>
            <CardDescription>Vos parties en cours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeRooms.map((room) => (
                <div
                  key={room.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-semibold">{room.gameType}</p>
                    <p className="text-muted-foreground text-sm">
                      Mise: {room.stake} Koras • {room.players.length}/
                      {room.maxPlayers} joueurs
                    </p>
                  </div>
                  <Link href={`/games/${room.gameType}/room/${room.id}`}>
                    <Button size="sm">Rejoindre</Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Composants utilitaires
interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string | number;
  description: string;
}

function StatCard({ icon: Icon, title, value, description }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-muted-foreground text-xs">{description}</p>
          </div>
          <Icon className="text-muted-foreground h-8 w-8" />
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="bg-muted mb-2 h-8 w-48 rounded-md" />
          <div className="bg-muted h-4 w-32 rounded-md" />
        </div>
        <div className="bg-muted h-24 w-64 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="bg-muted h-32 rounded-lg" />
        ))}
      </div>

      <div className="bg-muted h-64 rounded-lg" />
    </div>
  );
}
