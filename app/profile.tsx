import { RankBadge } from "@/components/ranking/RankBadge";
import { RankProgress } from "@/components/ranking/RankProgress";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { api } from "@/convex/_generated/api";
import { getRankFromPR, INITIAL_PR } from "@/convex/ranking";
import { useAuth } from "@/hooks/useAuth";
import { useColors } from "@/hooks/useColors";
import { useClerk } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const colors = useColors();
  const { userId, isSignedIn, clerkUser } = useAuth();
  const { signOut } = useClerk();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"profile" | "history">("profile");
  const [showAIGames, setShowAIGames] = useState(false);

  const user = useQuery(
    api.users.getCurrentUser,
    userId ? { clerkUserId: userId } : "skip"
  );

  const prStats = useQuery(
    api.ranking.getPRStats,
    user?._id ? { userId: user._id } : "skip"
  );

  const gameHistory = useQuery(
    api.games.getUserGameHistory,
    userId ? { clerkUserId: userId, limit: 50 } : "skip"
  );

  // Filtrer les parties IA par défaut
  const filteredGames = useMemo(() => {
    if (!gameHistory) return [];
    if (showAIGames) return gameHistory;
    return gameHistory.filter((game) => game.mode !== "AI");
  }, [gameHistory, showAIGames]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;

    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: 24,
    },
    header: {
      alignItems: "center",
      marginBottom: 24,
    },
    username: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.text,
      marginTop: 16,
    },
    email: {
      fontSize: 14,
      color: colors.mutedForeground,
      marginTop: 4,
    },
    tabs: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 24,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: colors.muted,
      alignItems: "center",
    },
    activeTab: {
      backgroundColor: colors.primary,
    },
    tabText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.mutedForeground,
    },
    activeTabText: {
      color: colors.primaryForeground,
    },
    rankSection: {
      alignItems: "center",
      gap: 16,
      marginBottom: 32,
    },
    statsSection: {
      marginBottom: 24,
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
    },
    statItem: {
      flex: 1,
      minWidth: "45%",
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
      color: colors.text,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: colors.mutedForeground,
      textAlign: "center",
    },
    balanceSection: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    balanceLabel: {
      fontSize: 14,
      color: colors.mutedForeground,
      marginBottom: 8,
    },
    balanceAmount: {
      fontSize: 32,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 4,
    },
    koraAmount: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.secondary,
    },
    actions: {
      gap: 12,
      marginBottom: 24,
    },
    filterContainer: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      alignItems: "center",
      marginBottom: 16,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    emptyText: {
      fontSize: 16,
      color: colors.mutedForeground,
      textAlign: "center",
      marginBottom: 24,
    },
    listContent: {
      paddingBottom: 100,
    },
    gameCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    gameHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    opponentInfo: {
      flex: 1,
      marginLeft: 12,
    },
    opponentName: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 4,
    },
    gameDate: {
      fontSize: 12,
      color: colors.mutedForeground,
    },
    resultBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    resultText: {
      fontSize: 12,
      fontWeight: "600",
    },
    gameDetails: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    betInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    betAmount: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
  });

  if (!user || !prStats) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Avatar
              src={user.avatarUrl || undefined}
              alt={user.username}
              size={100}
            />
            <Text style={styles.username}>{user.username}</Text>
            {clerkUser?.primaryEmailAddress && (
              <Text style={styles.email}>
                {clerkUser.primaryEmailAddress.emailAddress}
              </Text>
            )}
          </View>

          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "profile" && styles.activeTab]}
              onPress={() => setActiveTab("profile")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "profile" && styles.activeTabText,
                ]}
              >
                Profil
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "history" && styles.activeTab]}
              onPress={() => setActiveTab("history")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "history" && styles.activeTabText,
                ]}
              >
                Historique
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === "profile" ? (
            <>
              <View style={styles.rankSection}>
                <RankBadge
                  rank={getRankFromPR(user.pr || INITIAL_PR)}
                  size="large"
                />
                <RankProgress pr={user.pr || INITIAL_PR} />
              </View>

              <View style={styles.balanceSection}>
                <Text style={styles.balanceLabel}>Solde</Text>
                <Text style={styles.balanceAmount}>
                  {user.balance?.toLocaleString() || 0} {user.currency || "XAF"}
                </Text>
                <Text style={styles.koraAmount}>
                  {user.kora?.toLocaleString() || 0} Kora
                </Text>
              </View>

              <View style={styles.statsSection}>
                <Text style={styles.sectionTitle}>
                  Statistiques de classement
                </Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{prStats.currentPR}</Text>
                    <Text style={styles.statLabel}>PR Actuel</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{prStats.totalGames}</Text>
                    <Text style={styles.statLabel}>Parties jouées</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{prStats.wins}</Text>
                    <Text style={styles.statLabel}>Victoires</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {prStats.winRate.toFixed(1)}%
                    </Text>
                    <Text style={styles.statLabel}>Taux de victoire</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{prStats.maxPR}</Text>
                    <Text style={styles.statLabel}>PR Maximum</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {prStats.currentStreak}
                      {prStats.streakType === "win" ? " 🔥" : ""}
                    </Text>
                    <Text style={styles.statLabel}>
                      Série actuelle ({prStats.streakType === "win" ? "V" : "D"}
                      )
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.actions}>
                <Button
                  title="Paramètres"
                  onPress={() => router.push("/settings")}
                  variant="secondary"
                />
                <Button
                  title="Se déconnecter"
                  onPress={handleSignOut}
                  variant="destructive"
                />
              </View>
            </>
          ) : (
            <>
              <View style={styles.filterContainer}>
                <Button
                  title={
                    showAIGames ? "Masquer parties IA" : "Afficher parties IA"
                  }
                  onPress={() => setShowAIGames(!showAIGames)}
                  variant="outline"
                  size="sm"
                />
              </View>

              {!filteredGames || filteredGames.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    Aucune partie dans l&apos;historique.
                  </Text>
                  <Button
                    title="Jouer une partie"
                    onPress={() => router.push("/(tabs)")}
                    variant="primary"
                  />
                </View>
              ) : (
                <FlatList
                  data={filteredGames}
                  scrollEnabled={false}
                  keyExtractor={(item) => item.gameId}
                  contentContainerStyle={styles.listContent}
                  renderItem={({ item }) => (
                    <View style={styles.gameCard}>
                      <View style={styles.gameHeader}>
                        <Avatar
                          src={undefined}
                          alt={item.opponentName}
                          size={40}
                        />
                        <View style={styles.opponentInfo}>
                          <Text style={styles.opponentName}>
                            {item.opponentName}
                          </Text>
                          <Text style={styles.gameDate}>
                            {formatDate(item.endedAt || 0)}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.resultBadge,
                            {
                              backgroundColor:
                                item.result === "win" ?
                                  colors.success + "20"
                                : colors.destructive + "20",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.resultText,
                              {
                                color:
                                  item.result === "win" ?
                                    colors.success
                                  : colors.destructive,
                              },
                            ]}
                          >
                            {item.result === "win" ? "Victoire" : "Défaite"}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.gameDetails}>
                        <View style={styles.betInfo}>
                          <Badge
                            label={
                              item.betAmount > 0 ?
                                `${item.betAmount} ${user.currency || "XAF"}`
                              : "Gratuit"
                            }
                            variant={
                              item.betAmount > 0 ? "default" : "secondary"
                            }
                          />
                        </View>
                      </View>
                    </View>
                  )}
                />
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
