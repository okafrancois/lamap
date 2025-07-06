/**
 * Page Classement - Affichage complet du leaderboard
 * Implémente le système ELO avec tous les composants de ranking
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Leaderboard,
  LeaderboardStats,
} from "@/components/ranking/leaderboard";
import { EloBadge, EloCard } from "@/components/ranking/elo-badge";
import { calculateEloRating, ELO_RANKS } from "@/lib/elo/elo-system";
import {
  IconTrophy,
  IconMedal,
  IconUsers,
  IconChartLine,
  IconArrowLeft,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";

export default function RankingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedGameType, setSelectedGameType] = useState("garame");

  // Mock data - in real app, fetch from API based on selectedGameType
  const mockPlayers = [
    {
      id: "1",
      name: "Champion",
      eloRating: calculateEloRating(2450, 156, 121, 35),
      previousRating: 2425,
      position: 1,
      previousPosition: 1,
      isCurrentUser: false,
    },
    {
      id: "2",
      name: "Expert",
      eloRating: calculateEloRating(2210, 89, 67, 22),
      previousRating: 2205,
      position: 2,
      previousPosition: 3,
      isCurrentUser: false,
    },
    {
      id: "3",
      name: "Maître",
      eloRating: calculateEloRating(1980, 134, 89, 45),
      previousRating: 1995,
      position: 3,
      previousPosition: 2,
      isCurrentUser: false,
    },
    {
      id: "4",
      name: "Challenger",
      eloRating: calculateEloRating(1755, 67, 41, 26),
      previousRating: 1740,
      position: 4,
      previousPosition: 4,
      isCurrentUser: false,
    },
    {
      id: "5",
      name: "Rising Star",
      eloRating: calculateEloRating(1689, 43, 29, 14),
      previousRating: 1650,
      position: 5,
      previousPosition: 8,
      isCurrentUser: false,
    },
    {
      id: "user",
      name: user?.name ?? "Vous",
      avatar: user?.image ?? undefined,
      eloRating: calculateEloRating(1456, 24, 15, 9),
      previousRating: 1423,
      position: 12,
      previousPosition: 15,
      isCurrentUser: true,
    },
    // Add more mock players...
    ...Array.from({ length: 20 }, (_, i) => ({
      id: `player-${i + 6}`,
      name: `Joueur ${i + 6}`,
      eloRating: calculateEloRating(
        Math.floor(Math.random() * 1500) + 800,
        Math.floor(Math.random() * 100) + 10,
        Math.floor(Math.random() * 50) + 5,
        Math.floor(Math.random() * 30) + 2,
      ),
      previousRating: Math.floor(Math.random() * 1500) + 800,
      position: i + 6,
      previousPosition: Math.floor(Math.random() * 30) + 1,
      isCurrentUser: false,
    })),
  ];

  // User's current ELO rating
  const userRating = mockPlayers.find((p) => p.isCurrentUser)?.eloRating;

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          className="mb-8 flex items-center justify-between"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <IconArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-foreground flex items-center gap-3 text-4xl font-bold">
                <IconTrophy className="text-chart-5 h-8 w-8" />
                Classement Global
              </h1>
              <p className="text-muted-foreground mt-1">
                Système ELO - Compétition et progression
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <IconUsers className="h-3 w-3" />
              {mockPlayers.length} joueurs actifs
            </Badge>
          </div>
        </motion.div>

        {/* User's ELO Card */}
        {userRating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <h2 className="text-foreground mb-4 flex items-center gap-2 text-xl font-semibold">
              <IconMedal className="text-primary h-5 w-5" />
              Votre Progression
            </h2>
            <EloCard
              eloRating={userRating}
              showStats={true}
              showProgress={true}
              className="max-w-md"
            />
          </motion.div>
        )}

        {/* Game Type Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs
            value={selectedGameType}
            onValueChange={setSelectedGameType}
            className="mb-8"
          >
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="garame">Garame</TabsTrigger>
              <TabsTrigger value="global" disabled>
                Global (Bientôt)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="garame" className="space-y-6">
              {/* Statistics */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="text-foreground mb-4 flex items-center gap-2 text-lg font-semibold">
                  <IconChartLine className="text-chart-3 h-5 w-5" />
                  Statistiques Garame
                </h3>
                <LeaderboardStats players={mockPlayers} />
              </motion.div>

              {/* Rank Distribution */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-card-foreground">
                      Distribution des Rangs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      {ELO_RANKS.slice(0, 8).map((rank) => {
                        const playersInRank = mockPlayers.filter(
                          (p) => p.eloRating.rank.name === rank.name,
                        ).length;

                        return (
                          <div
                            key={rank.name}
                            className="bg-muted/20 rounded-lg p-3 text-center"
                          >
                            <EloBadge
                              rating={rank.minRating + 50}
                              size="sm"
                              showRating={false}
                            />
                            <div className="text-muted-foreground mt-2 text-sm">
                              {playersInRank} joueurs
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Main Leaderboard */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Leaderboard
                  players={mockPlayers}
                  title="Classement Garame"
                  gameType="Garame"
                  showSearch={true}
                  showFilters={true}
                  maxItems={50}
                />
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
