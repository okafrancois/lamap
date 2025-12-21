import { RankInfo } from "@/convex/ranking";
import { useColors } from "@/hooks/useColors";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { PlayerRankCard } from "./PlayerRankCard";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl?: string;
  pr: number;
  rankTier: RankInfo;
  country?: string;
}

interface LeaderboardListProps {
  entries?: LeaderboardEntry[];
  currentUserId?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  onPlayerPress?: (userId: string) => void;
  contentContainerStyle?: ViewStyle;
}

export function LeaderboardList({
  entries,
  currentUserId,
  onRefresh,
  refreshing = false,
  onPlayerPress,
  contentContainerStyle,
}: LeaderboardListProps) {
  const colors = useColors();
  const router = useRouter();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 32,
    },
    emptyText: {
      fontSize: 16,
      color: colors.mutedForeground,
      textAlign: "center",
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 32,
    },
    listContent: {
      padding: 20,
    },
    currentUserHighlight: {
      paddingHorizontal: 20,
      borderRadius: 8,
      marginBottom: 8,
    },
    currentUserText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      textAlign: "center",
    },
  });

  const handlePlayerPress = (entry: LeaderboardEntry) => {
    if (onPlayerPress) {
      onPlayerPress(entry.userId);
    } else {
      router.push(`/user/${entry.userId}`);
    }
  };

  if (!entries) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (entries.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Aucun joueur dans ce classement.</Text>
      </View>
    );
  }

  const currentUserEntry = entries.find(
    (entry) => entry.userId === currentUserId
  );

  return (
    <View style={styles.container}>
      {currentUserEntry && (
        <View style={styles.currentUserHighlight}>
          <Text style={styles.currentUserText}>
            Votre position : #{currentUserEntry.rank}
          </Text>
        </View>
      )}
      <FlatList
        data={entries}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={[styles.listContent, contentContainerStyle]}
        renderItem={({ item }) => (
          <PlayerRankCard
            rank={item.rank}
            username={item.username}
            avatarUrl={item.avatarUrl}
            pr={item.pr}
            rankTier={item.rankTier}
            country={item.country}
            isCurrentUser={item.userId === currentUserId}
            onPress={() => handlePlayerPress(item)}
          />
        )}
        refreshControl={
          onRefresh ?
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          : undefined
        }
      />
    </View>
  );
}
