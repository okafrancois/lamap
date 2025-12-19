import { RankInfo } from "@/convex/ranking";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface RankBadgeProps {
  rank: RankInfo;
  size?: "small" | "medium" | "large";
  showName?: boolean;
  showPR?: boolean;
  pr?: number;
}

export function RankBadge({
  rank,
  size = "medium",
  showName = false,
  showPR = false,
  pr,
}: RankBadgeProps) {
  const sizeStyles = {
    small: {
      container: styles.containerSmall,
      icon: styles.iconSmall,
      name: styles.nameSmall,
      pr: styles.prSmall,
    },
    medium: {
      container: styles.containerMedium,
      icon: styles.iconMedium,
      name: styles.nameMedium,
      pr: styles.prMedium,
    },
    large: {
      container: styles.containerLarge,
      icon: styles.iconLarge,
      name: styles.nameLarge,
      pr: styles.prLarge,
    },
  };

  const currentSizeStyles = sizeStyles[size];

  return (
    <View style={[styles.container, currentSizeStyles.container]}>
      <View
        style={[
          styles.badge,
          {
            backgroundColor: rank.color + "20",
            borderColor: rank.color,
          },
        ]}
      >
        <Text style={[styles.icon, currentSizeStyles.icon]}>{rank.icon}</Text>
      </View>
      {showName && (
        <Text
          style={[styles.name, currentSizeStyles.name, { color: rank.color }]}
        >
          {rank.name}
        </Text>
      )}
      {showPR && pr !== undefined && (
        <Text style={[styles.pr, currentSizeStyles.pr]}>{pr} PR</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 4,
  },
  badge: {
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    textAlign: "center",
  },
  name: {
    fontWeight: "700",
    textAlign: "center",
  },
  pr: {
    fontSize: 12,
    color: "#888",
    fontWeight: "600",
  },

  containerSmall: {
    gap: 2,
  },
  iconSmall: {
    fontSize: 16,
    padding: 4,
  },
  nameSmall: {
    fontSize: 10,
  },
  prSmall: {
    fontSize: 9,
  },

  containerMedium: {
    gap: 4,
  },
  iconMedium: {
    fontSize: 24,
    padding: 8,
  },
  nameMedium: {
    fontSize: 14,
  },
  prMedium: {
    fontSize: 12,
  },

  containerLarge: {
    gap: 8,
  },
  iconLarge: {
    fontSize: 48,
    padding: 16,
  },
  nameLarge: {
    fontSize: 20,
  },
  prLarge: {
    fontSize: 16,
  },
});
