import { Avatar } from "@/components/ui/Avatar";
import { RankBadge } from "@/components/ranking/RankBadge";
import { useColors } from "@/hooks/useColors";
import { RankInfo } from "@/convex/ranking";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface PlayerRankCardProps {
  rank: number;
  username: string;
  avatarUrl?: string;
  pr: number;
  rankTier: RankInfo;
  country?: string;
  isCurrentUser?: boolean;
  onPress?: () => void;
}

export function PlayerRankCard({
  rank,
  username,
  avatarUrl,
  pr,
  rankTier,
  country,
  isCurrentUser = false,
  onPress,
}: PlayerRankCardProps) {
  const colors = useColors();

  const styles = StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      backgroundColor: isCurrentUser ? colors.accent : colors.card,
      borderRadius: 12,
      marginBottom: 8,
      borderWidth: isCurrentUser ? 2 : 1,
      borderColor: isCurrentUser ? colors.primary : colors.border,
    },
    rankContainer: {
      width: 40,
      alignItems: "center",
      marginRight: 12,
    },
    rankText: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
    },
    rankTextTop: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.primary,
    },
    avatarContainer: {
      marginRight: 12,
    },
    infoContainer: {
      flex: 1,
    },
    usernameRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },
    username: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginRight: 8,
    },
    prContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    prLabel: {
      fontSize: 12,
      color: colors.mutedForeground,
      marginRight: 4,
    },
    prValue: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
    },
    countryContainer: {
      marginLeft: 8,
    },
    countryText: {
      fontSize: 12,
      color: colors.mutedForeground,
    },
  });

  const getRankDisplay = () => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  const content = (
    <View style={styles.card}>
      <View style={styles.rankContainer}>
        <Text style={rank <= 3 ? styles.rankTextTop : styles.rankText}>
          {getRankDisplay()}
        </Text>
      </View>
      <View style={styles.avatarContainer}>
        <Avatar
          imageUrl={avatarUrl}
          name={username}
          size={48}
        />
      </View>
      <View style={styles.infoContainer}>
        <View style={styles.usernameRow}>
          <Text style={styles.username}>{username}</Text>
          <RankBadge rank={rankTier} size="small" showName={false} />
        </View>
        <View style={styles.prContainer}>
          <Text style={styles.prLabel}>PR:</Text>
          <Text style={styles.prValue}>{pr.toLocaleString()}</Text>
          {country && (
            <View style={styles.countryContainer}>
              <Text style={styles.countryText}>{country}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

