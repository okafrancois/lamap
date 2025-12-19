import { Colors } from "@/constants/theme";
import { getRankFromPR, INITIAL_PR } from "@/convex/ranking";
import { useColors } from "@/hooks/useColors";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { RankBadge } from "./RankBadge";

interface RankProgressProps {
  pr: number;
  showDetails?: boolean;
}

export function RankProgress({
  pr = INITIAL_PR,
  showDetails = true,
}: RankProgressProps) {
  const colors = useColors();
  const currentRank = getRankFromPR(pr);

  const progress =
    currentRank.maxPR === Infinity ?
      100
    : ((pr - currentRank.minPR) / (currentRank.maxPR - currentRank.minPR)) *
      100;

  const prInCurrentRank = pr - currentRank.minPR;
  const prToNextRank =
    currentRank.maxPR === Infinity ? 0 : currentRank.maxPR - pr;
  const totalPRInRank =
    currentRank.maxPR === Infinity ? 0 : currentRank.maxPR - currentRank.minPR;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <RankBadge rank={currentRank} size="medium" showName />
        <Text style={[styles.prValue, { color: colors.text }]}>{pr} PR</Text>
      </View>

      {showDetails && (
        <>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBarBackground,
                { backgroundColor: colors.muted },
              ]}
            >
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min(progress, 100)}%`,
                    backgroundColor: Colors.gameUI.orSable,
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.details}>
            {currentRank.maxPR !== Infinity ?
              <>
                <Text
                  style={[styles.detailText, { color: colors.mutedForeground }]}
                >
                  {prInCurrentRank} / {totalPRInRank} PR
                </Text>
                <Text
                  style={[styles.detailText, { color: colors.mutedForeground }]}
                >
                  {prToNextRank} PR pour le rang suivant
                </Text>
              </>
            : <Text
                style={[styles.detailText, { color: colors.mutedForeground }]}
              >
                Rang maximum atteint ! 🎉
              </Text>
            }
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  prValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  progressBarContainer: {
    width: "100%",
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  details: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
