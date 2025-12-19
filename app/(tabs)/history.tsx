import { Avatar } from "@/components/ui/Avatar";
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
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HistoryScreen() {
  const colors = useColors();
  const router = useRouter();
  const { userId, isSignedIn } = useAuth();

  const gameHistory = useQuery(
    api.games.getUserGameHistory,
    userId ? { clerkUserId: userId, limit: 50 } : "skip"
  );

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
      padding: 16,
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
    winBadge: {
      backgroundColor: colors.secondary,
    },
    lossBadge: {
      backgroundColor: colors.destructive,
    },
    resultText: {
      fontSize: 14,
      fontWeight: "600",
    },
    winText: {
      color: colors.secondaryForeground,
    },
    lossText: {
      color: colors.destructiveForeground,
    },
    gameDetails: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    detailItem: {
      flex: 1,
    },
    detailLabel: {
      fontSize: 12,
      color: colors.mutedForeground,
      marginBottom: 4,
    },
    detailValue: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },
    gainValue: {
      fontSize: 16,
      fontWeight: "700",
    },
    positiveGain: {
      color: colors.secondary,
    },
    negativeGain: {
      color: colors.destructive,
    },
    replayButton: {
      minHeight: 36,
    },
    victoryTypeContainer: {
      marginTop: 8,
      marginBottom: 8,
    },
    text: {
      color: colors.text,
    },
  });

  if (!isSignedIn) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <View style={styles.emptyContainer}>
          <Text style={styles.text}>Veuillez vous connecter</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (gameHistory === undefined) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      </SafeAreaView>
    );
  }

  if (gameHistory.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Vous n&apos;avez pas encore joué de partie.{"\n"}
            Lancez votre première partie !
          </Text>
          <Button
            title="Jouer"
            onPress={() => router.push("/(lobby)/select-mode")}
          />
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

  const getVictoryTypeLabel = (victoryType: string | null) => {
    if (!victoryType) return null;
    const labels: Record<string, string> = {
      normal: "Victoire normale",
      auto_sum: "Victoire auto (somme 31+)",
      auto_lowest: "Victoire auto (main faible)",
      auto_sevens: "Victoire auto (triple 7)",
      simple_kora: "Kora simple",
      double_kora: "Kora double",
      triple_kora: "Kora triple",
    };
    return labels[victoryType] || victoryType;
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <FlatList
        data={gameHistory}
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => item.gameId}
        renderItem={({ item }) => (
          <View style={styles.gameCard}>
            <View style={styles.gameHeader}>
              <Avatar
                name={item.opponent?.username || "Adversaire"}
                imageUrl={item.opponent?.avatarUrl || undefined}
                size={40}
                variant="secondary"
              />

              <View style={styles.opponentInfo}>
                <Text style={styles.opponentName}>
                  {item.opponent?.username || "Adversaire"}
                  {item.opponent?.isAI ? " (IA)" : ""}
                </Text>
                <Text style={styles.gameDate}>{formatDate(item.endedAt)}</Text>
              </View>
              <View
                style={[
                  styles.resultBadge,
                  item.result === "win" ? styles.winBadge : styles.lossBadge,
                ]}
              >
                <Text
                  style={[
                    styles.resultText,
                    item.result === "win" ? styles.winText : styles.lossText,
                  ]}
                >
                  {item.result === "win" ? "Victoire 🎉 !" : "Défaite 😭"}
                </Text>
              </View>
            </View>

            {item.victoryType && (
              <View style={styles.victoryTypeContainer}>
                <Badge
                  label={getVictoryTypeLabel(item.victoryType) || ""}
                  variant="default"
                />
              </View>
            )}

            <View style={styles.gameDetails}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Mise</Text>
                <Text style={styles.detailValue}>
                  {item.bet.amount} {item.bet.currency}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>
                  {item.result === "win" ? "Gain" : "Perte"}
                </Text>
                <Text
                  style={[
                    styles.gainValue,
                    item.gain > 0 ? styles.positiveGain : styles.negativeGain,
                  ]}
                >
                  {item.gain > 0 ? "+" : ""}
                  {item.gain} {item.bet.currency}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Tours</Text>
                <Text style={styles.detailValue}>{item.currentRound}/5</Text>
              </View>
            </View>

            <Button
              title="Revoir la partie"
              onPress={() => router.push(`/(game)/replay/${item.gameId}`)}
              variant="outline"
              style={styles.replayButton}
            />
          </View>
        )}
      />
    </SafeAreaView>
  );
}
