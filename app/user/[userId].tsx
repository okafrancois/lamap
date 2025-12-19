import { ChallengeModal } from "@/components/challenges/ChallengeModal";
import { RankBadge } from "@/components/ranking/RankBadge";
import { RankProgress } from "@/components/ranking/RankProgress";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { getCurrencyFromCountry } from "@/convex/currencies";
import { getRankFromPR, INITIAL_PR } from "@/convex/ranking";
import { useAuth } from "@/hooks/useAuth";
import { useColors } from "@/hooks/useColors";
import { useQuery } from "convex/react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SceneMap, TabBar, TabView } from "react-native-tab-view";

export default function PublicProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { convexUser } = useAuth();
  const [index, setIndex] = useState(0);
  const [showAIGames, setShowAIGames] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const layout = Dimensions.get("window");

  const profileUserId = userId as any;

  const user = useQuery(
    api.users.getPublicUserProfile,
    profileUserId ? { userId: profileUserId } : "skip"
  );

  const prStats = useQuery(
    api.ranking.getPRStats,
    profileUserId ? { userId: profileUserId } : "skip"
  );

  const gameHistory = useQuery(
    api.games.getUserGameHistory,
    profileUserId && convexUser?._id ?
      { userId: profileUserId, viewerUserId: convexUser._id, limit: 50 }
    : "skip"
  );

  // Filtrer les parties IA par défaut
  const filteredGames = useMemo(() => {
    if (!gameHistory) return [];
    if (showAIGames) return gameHistory;
    return gameHistory.filter((game) => game.mode !== "AI");
  }, [gameHistory, showAIGames]);

  const isOwnProfile = convexUser?._id === profileUserId;

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
      paddingVertical: 10,
      paddingHorizontal: 16,
      backgroundColor: colors.background,
    },
    headerInfo: {
      alignItems: "center",
      marginTop: 16,
    },
    avatarContainer: {
      position: "relative",
    },
    username: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.text,
      marginTop: 8,
    },
    usernameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 8,
    },
    sceneContainer: {
      flex: 1,
    },
    rankSection: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.border,
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
    statItemHighlight: {
      backgroundColor: colors.accent,
      borderWidth: 2,
      borderColor: Colors.gameUI.orSable,
    },
    statIcon: {
      fontSize: 24,
      marginBottom: 8,
    },
    statValue: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 4,
    },
    statValueHighlight: {
      fontSize: 28,
      color: Colors.gameUI.orSable,
    },
    statLabel: {
      fontSize: 12,
      color: colors.mutedForeground,
      textAlign: "center",
    },
    statLabelHighlight: {
      fontSize: 14,
      fontWeight: "600",
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
      paddingHorizontal: 24,
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
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
  });

  const currentRank = getRankFromPR(user?.pr || INITIAL_PR);

  const ProfileScene = React.useMemo(() => {
    const ProfileSceneComponent = () => (
      <ScrollView style={styles.sceneContainer}>
        <View style={styles.content}>
          <View style={styles.rankSection}>
            <RankProgress pr={user?.pr || INITIAL_PR} />
          </View>

          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Statistiques de classement</Text>
            <View style={styles.statsGrid}>
              <View style={[styles.statItem, styles.statItemHighlight]}>
                <IconSymbol
                  name="scope"
                  size={24}
                  color={Colors.gameUI.orSable}
                  style={styles.statIcon}
                />
                <Text style={[styles.statValue, styles.statValueHighlight]}>
                  {prStats?.currentPR || 0}
                </Text>
                <Text style={[styles.statLabel, styles.statLabelHighlight]}>
                  PR Actuel
                </Text>
              </View>
              <View style={styles.statItem}>
                <IconSymbol
                  name="gamecontroller.fill"
                  size={24}
                  color={colors.mutedForeground}
                  style={styles.statIcon}
                />
                <Text style={styles.statValue}>{prStats?.totalGames || 0}</Text>
                <Text style={styles.statLabel}>Parties jouées</Text>
              </View>
              <View style={styles.statItem}>
                <IconSymbol
                  name="trophy.fill"
                  size={24}
                  color={colors.mutedForeground}
                  style={styles.statIcon}
                />
                <Text style={styles.statValue}>{prStats?.wins || 0}</Text>
                <Text style={styles.statLabel}>Victoires</Text>
              </View>
              <View style={[styles.statItem, styles.statItemHighlight]}>
                <IconSymbol
                  name="chart.bar"
                  size={24}
                  color={Colors.gameUI.orSable}
                  style={styles.statIcon}
                />
                <Text style={[styles.statValue, styles.statValueHighlight]}>
                  {prStats?.winRate.toFixed(1) || "0.0"}%
                </Text>
                <Text style={[styles.statLabel, styles.statLabelHighlight]}>
                  Taux de victoire
                </Text>
              </View>
              <View style={styles.statItem}>
                <IconSymbol
                  name="star.fill"
                  size={24}
                  color={colors.mutedForeground}
                  style={styles.statIcon}
                />
                <Text style={styles.statValue}>{prStats?.maxPR || 0}</Text>
                <Text style={styles.statLabel}>PR Maximum</Text>
              </View>
              <View style={styles.statItem}>
                <IconSymbol
                  name={
                    prStats?.streakType === "win" ? "flame.fill" : "drop.fill"
                  }
                  size={24}
                  color={
                    prStats?.streakType === "win" ?
                      colors.secondary
                    : colors.mutedForeground
                  }
                  style={styles.statIcon}
                />
                <Text style={styles.statValue}>
                  {prStats?.currentStreak || 0}
                </Text>
                <Text style={styles.statLabel}>
                  Série actuelle ({prStats?.streakType === "win" ? "V" : "D"})
                </Text>
              </View>
            </View>
          </View>

          {!isOwnProfile && (
            <View style={styles.actions}>
              <Button
                title="Défier"
                onPress={() => setShowChallengeModal(true)}
                variant="primary"
              />
              <Button
                title="Envoyer un message"
                onPress={() => {
                  // TODO: Ouvrir conversation
                }}
                variant="secondary"
              />
            </View>
          )}
        </View>
      </ScrollView>
    );
    ProfileSceneComponent.displayName = "ProfileScene";
    return ProfileSceneComponent;
  }, [user, prStats, styles, colors, isOwnProfile]);

  const HistoryScene = React.useMemo(() => {
    const HistorySceneComponent = () => (
      <View style={styles.sceneContainer}>
        <View style={styles.filterContainer}>
          <Button
            title={showAIGames ? "Masquer parties IA" : "Afficher parties IA"}
            onPress={() => setShowAIGames(!showAIGames)}
            variant="outline"
            size="sm"
          />
        </View>

        {!filteredGames || filteredGames.length === 0 ?
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Aucune partie dans l&apos;historique.
            </Text>
          </View>
        : <FlatList
            data={filteredGames}
            keyExtractor={(item) => item.gameId}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.gameCard}
                onPress={() => {
                  // Navigation vers le profil de l'adversaire si ce n'est pas une IA
                  if (
                    item.opponent &&
                    !item.opponent.isAI &&
                    item.opponent._id
                  ) {
                    router.push(`/user/${item.opponent._id}`);
                  }
                }}
              >
                <View style={styles.gameHeader}>
                  <Avatar
                    imageUrl={item.opponent?.avatarUrl || undefined}
                    name={item.opponent?.username || "Adversaire"}
                    size={40}
                  />
                  <View style={styles.opponentInfo}>
                    <Text style={styles.opponentName}>
                      {item.opponent?.username || "Adversaire"}
                    </Text>
                    <Text style={styles.gameDate}>
                      {format(new Date(item.endedAt || 0), "d MMM", {
                        locale: fr,
                      })}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.resultBadge,
                      {
                        backgroundColor:
                          item.result === "win" ?
                            colors.secondary + "20"
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
                              colors.secondary
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
                        item.bet.masked ? "Partie avec mise"
                        : item.bet.amount > 0 ?
                          `${item.bet.amount} ${item.bet.currency}`
                        : "Gratuit"
                      }
                      variant={item.bet.amount > 0 ? "default" : "warning"}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        }
      </View>
    );
    HistorySceneComponent.displayName = "HistoryScene";
    return HistorySceneComponent;
  }, [filteredGames, showAIGames, colors, router, styles]);

  const routes = [
    { key: "profile", title: "Profil" },
    { key: "history", title: "Parties" },
  ];

  const renderScene = SceneMap({
    profile: ProfileScene,
    history: HistoryScene,
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

  const renderTabBar = (props: any) => (
    <TabBar
      {...props}
      indicatorStyle={{
        backgroundColor: colors.primary,
        height: 4,
        borderRadius: 2,
      }}
      style={{
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
      activeColor={colors.primary}
      inactiveColor={colors.mutedForeground}
      labelStyle={{
        fontSize: 14,
        fontWeight: "600",
        textTransform: "none",
      }}
      tabStyle={{
        width: "auto",
        paddingHorizontal: 16,
      }}
      contentContainerStyle={{
        paddingHorizontal: 16,
      }}
      renderLabel={({
        route,
        focused,
        color,
      }: {
        route: { title: string; key: string };
        focused: boolean;
        color: string;
      }) => (
        <View
          style={{
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 8,
            backgroundColor: focused ? colors.accent : "transparent",
          }}
        >
          <Text
            style={{
              color,
              fontSize: 14,
              fontWeight: "600",
            }}
          >
            {route.title}
          </Text>
        </View>
      )}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Avatar
            imageUrl={user.avatarUrl || undefined}
            name={user.username}
            size={80}
          />
        </View>
        <View style={styles.headerInfo}>
          <View style={styles.usernameRow}>
            <Text style={styles.username}>{user.username}</Text>
            <RankBadge rank={currentRank} size="small" showName />
          </View>
        </View>
      </View>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={renderTabBar}
      />
      <ChallengeModal
        visible={showChallengeModal}
        onClose={() => setShowChallengeModal(false)}
        challengedUserId={profileUserId}
        challengedUsername={user?.username || ""}
        currency={user?.country ? getCurrencyFromCountry(user.country) : "XAF"}
      />
    </SafeAreaView>
  );
}
