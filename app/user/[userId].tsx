import { RankBadge } from "@/components/ranking/RankBadge";
import { RankProgress } from "@/components/ranking/RankProgress";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { getRankFromPR, INITIAL_PR } from "@/convex/ranking";
import { useAuth } from "@/hooks/useAuth";
import { useColors } from "@/hooks/useColors";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function UserProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const { userId: targetUserId } = useLocalSearchParams<{ userId: string }>();
  const { userId: currentClerkUserId } = useAuth();

  const currentUser = useQuery(
    api.users.getCurrentUser,
    currentClerkUserId ? { clerkUserId: currentClerkUserId } : "skip"
  );
  const myUserId = currentUser?._id;

  const targetUser = useQuery(
    api.users.getUserById,
    targetUserId ? { userId: targetUserId as Id<"users"> } : "skip"
  );

  const areFriends = useQuery(
    api.friends.areFriends,
    myUserId && targetUserId ?
      { userId: myUserId, otherUserId: targetUserId as Id<"users"> }
    : "skip"
  );

  const prStats = useQuery(
    api.ranking.getPRStats,
    targetUserId ? { userId: targetUserId as Id<"users"> } : "skip"
  );

  const handleChallenge = () => {
    Alert.alert(
      "Défier ce joueur",
      "Fonctionnalité bientôt disponible ! Vous pourrez inviter ce joueur en partie privée."
    );
  };

  const handleAddFriend = () => {
    router.push("/(tabs)/friends");
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    content: {
      padding: 24,
    },
    header: {
      alignItems: "center",
      marginBottom: 32,
    },
    username: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    rankSection: {
      alignItems: "center",
      gap: 16,
      marginBottom: 24,
    },
    actions: {
      flexDirection: "row",
      gap: 12,
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
    backButton: {
      position: "absolute",
      top: 16,
      left: 16,
      zIndex: 10,
    },
  });

  if (!targetUser || !prStats) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const isOwnProfile = myUserId === targetUserId;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>

      <ScrollView>
        <View style={styles.content}>
          <View style={styles.header}>
            <Avatar
              imageUrl={targetUser.avatarUrl || undefined}
              name={targetUser.username}
              size={100}
            />
            <Text style={styles.username}>{targetUser.username}</Text>
          </View>

          <View style={styles.rankSection}>
            <RankBadge
              rank={getRankFromPR(targetUser.pr || INITIAL_PR)}
              size="large"
            />
            <RankProgress pr={targetUser.pr || INITIAL_PR} />
          </View>

          {!isOwnProfile && (
            <View style={styles.actions}>
              <Button
                title="Défier"
                onPress={handleChallenge}
                variant="primary"
                style={{ flex: 1 }}
              />
              {!areFriends && (
                <Button
                  title="Ajouter en ami"
                  onPress={handleAddFriend}
                  variant="secondary"
                  style={{ flex: 1 }}
                />
              )}
            </View>
          )}

          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Statistiques de classement</Text>
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
                  Série actuelle ({prStats.streakType === "win" ? "V" : "D"})
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

