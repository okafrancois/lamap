import { RankBadge } from "@/components/ranking/RankBadge";
import { RANK_TIERS, type RankTier } from "@/convex/ranking";
import { useColors } from "@/hooks/useColors";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface RankSelectorProps {
  selectedRank?: RankTier;
  onSelectRank: (rank: RankTier) => void;
}

export function RankSelector({
  selectedRank,
  onSelectRank,
}: RankSelectorProps) {
  const colors = useColors();

  const styles = StyleSheet.create({
    container: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 12,
      fontWeight: "500",
      color: colors.mutedForeground,
      marginBottom: 8,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    ranksContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },
    rankButton: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 6,
      borderWidth: 1,
      backgroundColor: colors.card,
      minHeight: 32,
    },
    rankButtonSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.primary,
    },
    rankButtonUnselected: {
      borderColor: colors.border,
    },
    rankButtonContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    rankName: {
      fontSize: 12,
      fontWeight: "500",
      color: colors.text,
    },
  });

  const ranks: RankTier[] = [
    "BRONZE",
    "SILVER",
    "GOLD",
    "PLATINUM",
    "DIAMOND",
    "MASTER",
    "LEGEND",
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Classement par rang :</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.ranksContainer}
      >
        {ranks.map((rank) => {
          const rankInfo = RANK_TIERS[rank];
          const isSelected = selectedRank === rank;

          return (
            <TouchableOpacity
              key={rank}
              onPress={() => onSelectRank(rank)}
              style={[
                styles.rankButton,
                isSelected ?
                  styles.rankButtonSelected
                : styles.rankButtonUnselected,
              ]}
              activeOpacity={0.7}
            >
              <View style={styles.rankButtonContent}>
                <RankBadge rank={rankInfo} size="small" showName={false} />
                <Text style={styles.rankName}>{rankInfo.name}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
