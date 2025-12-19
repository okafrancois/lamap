import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useColors } from "@/hooks/useColors";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { userId, isSignedIn } = useAuth();
  const user = useQuery(
    api.users.getCurrentUser,
    userId ? { clerkUserId: userId } : "skip"
  );
  const activeGame = useQuery(
    api.games.getActiveMatch,
    userId ? { clerkId: userId } : "skip"
  );
  const userStats = useQuery(
    api.users.getUserStats,
    userId ? { clerkUserId: userId } : "skip"
  );
  const allRecentGames = useQuery(
    api.games.getRecentGames,
    userId ? { clerkUserId: userId, limit: 10 } : "skip"
  );

  // Filtrer les parties IA et ne garder que les 3 premières parties PvP
  const recentGames = allRecentGames?.filter((game) => game.mode !== "AI").slice(0, 3);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: 20,
      paddingBottom: 100,
    },
    header: {
      marginBottom: 24,
    },
    greeting: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: colors.mutedForeground,
    },
    activeMatchCard: {
      backgroundColor: colors.accent,
      borderRadius: 16,
      padding: 16,
      marginBottom: 20,
      borderWidth: 2,
      borderColor: colors.secondary,
    },
    activeMatchContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
    },
    activeMatchLabel: {
      fontSize: 14,
      color: colors.secondary,
      fontWeight: "700",
      marginBottom: 4,
    },
    activeMatchInfo: {
      fontSize: 16,
      color: colors.text,
      fontWeight: "600",
    },
    rejoinButton: {
      minHeight: 40,
      paddingHorizontal: 16,
      backgroundColor: colors.secondary,
    },
    rejoinButtonText: {
      color: colors.secondaryForeground,
      fontSize: 14,
    },
    balanceCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      alignItems: "center",
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    balanceLabel: {
      fontSize: 14,
      color: colors.mutedForeground,
      marginBottom: 8,
    },
    balanceAmount: {
      fontSize: 42,
      fontWeight: "700",
      color: colors.secondary,
      marginBottom: 8,
    },
    badge: {
      marginTop: 4,
    },
    playButton: {
      minHeight: 56,
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 16,
    },
    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      marginBottom: 24,
    },
    statCard: {
      flex: 1,
      minWidth: "30%",
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    statValue: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.secondary,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: colors.mutedForeground,
      textAlign: "center",
    },
    recentGamesSection: {
      marginBottom: 24,
    },
    recentGameCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 1,
      borderColor: colors.border,
    },
    recentGameInfo: {
      flex: 1,
    },
    opponentName: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 4,
    },
    gameDate: {
      fontSize: 12,
      color: colors.mutedForeground,
    },
    resultBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
    },
    winBadge: {
      backgroundColor: colors.secondary,
    },
    lossBadge: {
      backgroundColor: colors.destructive,
    },
    resultText: {
      fontSize: 12,
      fontWeight: "600",
    },
    winText: {
      color: colors.secondaryForeground,
    },
    lossText: {
      color: colors.destructiveForeground,
    },
    viewAllButton: {
      minHeight: 40,
    },
    achievementsSection: {
      marginBottom: 24,
    },
    achievementCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    achievementIcon: {
      fontSize: 32,
      marginRight: 12,
    },
    achievementInfo: {
      flex: 1,
    },
    achievementTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 2,
    },
    achievementDescription: {
      fontSize: 12,
      color: colors.mutedForeground,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    text: {
      color: colors.text,
    },
  });

  if (!isSignedIn) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.text}>Veuillez vous connecter</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user || !userStats || !recentGames) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      </SafeAreaView>
    );
  }

  const formatDate = (timestamp: number | null | undefined) => {
    if (!timestamp) return "Date inconnue";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `Il y a ${diffMins} min`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours}h`;
    } else if (diffDays < 7) {
      return `Il y a ${diffDays}j`;
    } else {
      return date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
      });
    }
  };

  const achievements = [
    {
      id: "first_win",
      title: "Première victoire",
      description: "Remporter votre première partie",
      icon: "🏆",
      unlocked: userStats.wins >= 1,
    },
    {
      id: "ten_wins",
      title: "Champion",
      description: "Remporter 10 parties",
      icon: "🎖️",
      unlocked: userStats.wins >= 10,
    },
    {
      id: "streak_5",
      title: "Série de 5",
      description: "Gagner 5 parties d'affilée",
      icon: "🔥",
      unlocked: userStats.bestStreak >= 5,
    },
    {
      id: "hundred_games",
      title: "Vétéran",
      description: "Jouer 100 parties",
      icon: "⭐",
      unlocked: userStats.totalGames >= 100,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {activeGame && (
            <View style={styles.activeMatchCard}>
              <View style={styles.activeMatchContent}>
                <View>
                  <Text style={styles.activeMatchLabel}>Partie en cours</Text>
                  <Text style={styles.activeMatchInfo}>
                    {activeGame.mode === "AI" ?
                      "Contre l'IA"
                    : "Contre un joueur"}{" "}
                    • {activeGame.bet.amount} {activeGame.bet.currency}
                  </Text>
                </View>
                <Button
                  title="Rejoindre"
                  onPress={() =>
                    router.push(`/(game)/match/${activeGame.gameId}`)
                  }
                  style={styles.rejoinButton}
                  textStyle={styles.rejoinButtonText}
                />
              </View>
            </View>
          )}

          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Votre solde</Text>
            <Text style={styles.balanceAmount}>
              {user.balance?.toLocaleString() || 0}
            </Text>
            <Badge
              label={user.currency || "XAF"}
              variant="default"
              style={styles.badge}
            />
          </View>

          <Button
            title="Lancer une partie"
            onPress={() => router.push("/(lobby)/select-mode")}
            style={styles.playButton}
          />

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{userStats.wins}</Text>
              <Text style={styles.statLabel}>Victoires</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{userStats.losses}</Text>
              <Text style={styles.statLabel}>Défaites</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{userStats.winRate}%</Text>
              <Text style={styles.statLabel}>Taux</Text>
            </View>
          </View>

          {recentGames.length > 0 && (
            <View style={styles.recentGamesSection}>
              <Text style={styles.sectionTitle}>Dernières parties</Text>
              {recentGames.map((game) => (
                <View key={game.gameId} style={styles.recentGameCard}>
                  <View style={styles.recentGameInfo}>
                    <Text style={styles.opponentName}>
                      vs {game.opponentName}
                    </Text>
                    <Text style={styles.gameDate}>
                      {formatDate(game.endedAt)} • {game.betAmount} XAF
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.resultBadge,
                      game.result === "win" ?
                        styles.winBadge
                      : styles.lossBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.resultText,
                        game.result === "win" ?
                          styles.winText
                        : styles.lossText,
                      ]}
                    >
                      {game.result === "win" ? "Victoire" : "Défaite"}
                    </Text>
                  </View>
                </View>
              ))}
              <Button
                title="Voir toutes les parties"
                onPress={() => router.push("/history")}
                variant="outline"
                style={styles.viewAllButton}
              />
            </View>
          )}

          <View style={styles.achievementsSection}>
            <Text style={styles.sectionTitle}>Trophées</Text>
            {achievements
              .filter((a) => a.unlocked)
              .map((achievement) => (
                <View key={achievement.id} style={styles.achievementCard}>
                  <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                  <View style={styles.achievementInfo}>
                    <Text style={styles.achievementTitle}>
                      {achievement.title}
                    </Text>
                    <Text style={styles.achievementDescription}>
                      {achievement.description}
                    </Text>
                  </View>
                </View>
              ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
