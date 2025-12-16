import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Colors } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useSound } from "@/hooks/useSound";
import { useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ResultScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const router = useRouter();
  const { userId } = useAuth();
  const user = useQuery(
    api.users.getCurrentUser,
    userId ? { clerkUserId: userId } : "skip"
  );
  const myUserId = user?._id;

  const game = useQuery(
    api.games.getGame,
    matchId ? { gameId: matchId } : "skip"
  );
  const { playSound } = useSound();

  const [displayedWinnings, setDisplayedWinnings] = useState(0);
  const cardOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.8);

  // Son de fin de partie et son de victoire/défaite
  useEffect(() => {
    if (game) {
      const isWinner = game.winnerId === myUserId;

      // Son de fin de partie
      playSound("gameEnd");

      // Son selon le type de victoire/défaite
      if (isWinner) {
        if (game.victoryType === "triple_kora") {
          playSound("koraTriple");
        } else if (game.victoryType === "double_kora") {
          playSound("koraDouble");
        } else if (game.victoryType === "simple_kora") {
          playSound("kora");
        } else if (
          game.victoryType === "auto_sum" ||
          game.victoryType === "auto_sevens"
        ) {
          playSound("autoVictory");
        } else {
          playSound("victory");
        }
      } else {
        playSound("defeat");
      }
    }
  }, [game, myUserId, playSound]);

  useEffect(() => {
    cardOpacity.value = withTiming(1, { duration: 300 });
    cardScale.value = withTiming(1, { duration: 300 });
  }, [cardOpacity, cardScale]);

  const isWinner = game?.winnerId === myUserId;
  const myPlayer = game?.players.find((p) => p.userId === myUserId);
  const winnings = myPlayer?.balance || 0;

  useEffect(() => {
    if (isWinner && winnings > 0) {
      const duration = 1500;
      const steps = 30;
      const stepValue = winnings / steps;
      const stepDuration = duration / steps;

      // Jouer le son de gain d'argent au début de l'animation
      playSound("winMoney");

      let current = 0;
      const interval = setInterval(() => {
        current += stepValue;
        if (current >= winnings) {
          setDisplayedWinnings(winnings);
          clearInterval(interval);
        } else {
          setDisplayedWinnings(Math.floor(current));
        }
      }, stepDuration);

      return () => clearInterval(interval);
    }
  }, [isWinner, winnings, playSound]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  if (!game) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Text style={styles.text}>Chargement...</Text>
      </SafeAreaView>
    );
  }

  const winTypeLabels: Record<string, string> = {
    normal: "Victoire normale",
    simple_kora: "Kora simple",
    double_kora: "Double Kora",
    triple_kora: "Triple Kora",
    auto_sum: "Main faible",
    auto_sevens: "Triple 7",
  };

  const winTypeLabel =
    winTypeLabels[game.victoryType || "normal"] || "Victoire";
  const totalBet = game.bet.amount * 2;
  const platformFee = totalBet * 0.1;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.resultCard,
            isWinner ? styles.winnerCard : styles.loserCard,
            cardAnimatedStyle,
          ]}
        >
          <Text style={styles.resultTitle}>
            {isWinner ? "🎉 Victoire !" : "😔 Défaite"}
          </Text>

          <View style={styles.winTypeContainer}>
            <Badge
              label={winTypeLabel}
              variant={isWinner ? "kora" : "default"}
              style={styles.winTypeBadge}
            />
            {game.victoryType && game.victoryType.includes("kora") && (
              <Badge
                label={
                  game.victoryType === "triple_kora" ? "x8"
                  : game.victoryType === "double_kora" ?
                    "x4"
                  : "x2"
                }
                variant="kora"
                style={styles.multiplierBadge}
              />
            )}
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Mise totale</Text>
              <Text style={styles.statValue}>
                {totalBet} {game.bet.currency}
              </Text>
            </View>
            {isWinner && (
              <>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Commission (10%)</Text>
                  <Text style={styles.statValue}>
                    -{platformFee} {game.bet.currency}
                  </Text>
                </View>
                {game.victoryType && game.victoryType.includes("kora") && (
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Type de victoire</Text>
                    <Text style={styles.statValue}>{winTypeLabel}</Text>
                  </View>
                )}
                <View style={[styles.statRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Gains</Text>
                  <Text style={styles.totalValue}>
                    {Math.round(displayedWinnings)} {game.bet.currency}
                  </Text>
                </View>
              </>
            )}
          </View>
        </Animated.View>

        <View style={styles.actions}>
          <Button
            title="Rejouer"
            onPress={() => router.replace("/(tabs)")}
            variant="primary"
            style={styles.button}
          />
          <Button
            title="Retour à l'accueil"
            onPress={() => router.replace("/(tabs)")}
            variant="secondary"
            style={styles.button}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.derived.blueDark,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  resultCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    borderWidth: 3,
  },
  winnerCard: {
    backgroundColor: Colors.primary.blue,
    borderColor: Colors.primary.gold,
  },
  loserCard: {
    backgroundColor: Colors.primary.blue,
    borderColor: Colors.primary.red,
  },
  resultTitle: {
    fontSize: 36,
    fontWeight: "700",
    color: Colors.derived.white,
    textAlign: "center",
    marginBottom: 16,
  },
  winTypeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
  },
  winTypeBadge: {
    marginHorizontal: 4,
  },
  multiplierBadge: {
    marginHorizontal: 4,
  },
  statsContainer: {
    gap: 12,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.derived.blueLight,
  },
  totalRow: {
    borderTopWidth: 2,
    borderTopColor: Colors.primary.gold,
    borderBottomWidth: 0,
    marginTop: 8,
    paddingTop: 16,
  },
  statLabel: {
    fontSize: 16,
    color: Colors.derived.blueLight,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.derived.white,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.primary.gold,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.primary.gold,
  },
  actions: {
    gap: 12,
  },
  button: {
    minHeight: 56,
  },
  text: {
    color: Colors.derived.white,
  },
});
