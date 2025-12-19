import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useColors } from "@/hooks/useColors";
import { useSound } from "@/hooks/useSound";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const PANEL_HEIGHT = 280;

interface ResultPanelProps {
  visible: boolean;
  game: {
    winnerId: string | null;
    victoryType: string | null;
    bet: { amount: number; currency: string };
    players: { userId: string | null; balance: number }[];
  };
  myUserId: string | null;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

export function ResultPanel({
  visible,
  game,
  myUserId,
  onPlayAgain,
  onGoHome,
}: ResultPanelProps) {
  const colors = useColors();
  const { playSound } = useSound();
  const soundPlayedRef = useRef(false);

  const translateY = useSharedValue(PANEL_HEIGHT);
  const opacity = useSharedValue(0);

  const isWinner = game.winnerId === myUserId;
  const totalBet = game.bet.amount * 2;
  const platformFee = totalBet * 0.02;

  const opponentBet = game.bet.amount;
  let winnings = 0;
  let multiplier = 1;

  if (isWinner) {
    if (game.victoryType === "triple_kora") {
      multiplier = 8;
      winnings = opponentBet * multiplier - platformFee;
    } else if (game.victoryType === "double_kora") {
      multiplier = 4;
      winnings = opponentBet * multiplier - platformFee;
    } else if (game.victoryType === "simple_kora") {
      multiplier = 2;
      winnings = opponentBet * multiplier - platformFee;
    } else {
      winnings = opponentBet - platformFee;
    }
  }

  const getVictoryTitle = () => {
    if (game.victoryType === "triple_kora") return "333 Export ! 🎯";
    if (game.victoryType === "double_kora") return "33 Export ! 🎲";
    if (game.victoryType === "simple_kora") return "Kora ! 🃏";
    if (game.victoryType === "auto_sum") return "Auto-victoire (Somme) ⚡";
    if (game.victoryType === "auto_sevens") return "Auto-victoire (7) ⚡";
    if (game.victoryType === "auto_lowest") return "Auto-victoire ⚡";
    return "Victoire";
  };

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 90,
      });
      opacity.value = withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
    } else {
      translateY.value = withTiming(PANEL_HEIGHT, {
        duration: 250,
        easing: Easing.in(Easing.ease),
      });
      opacity.value = withTiming(0, { duration: 200 });
      soundPlayedRef.current = false;
    }
  }, [visible, translateY, opacity]);

  useEffect(() => {
    if (visible && game && !soundPlayedRef.current) {
      if (isWinner) {
        if (game.victoryType === "triple_kora") {
          playSound("koraTriple");
        } else if (game.victoryType === "double_kora") {
          playSound("koraDouble");
        } else if (game.victoryType === "simple_kora") {
          playSound("kora");
        } else if (
          game.victoryType === "auto_sum" ||
          game.victoryType === "auto_sevens" ||
          game.victoryType === "auto_lowest"
        ) {
          playSound("autoVictory");
        } else {
          playSound("victory");
        }
      } else {
        playSound("defeat");
      }
      soundPlayedRef.current = true;
    }
  }, [visible, game, isWinner, playSound]);

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const gradientColors: readonly [string, string, string] =
    isWinner ?
      ["#2D5016", "#3D6B1F", "#4A8227"]
    : ["#2A2A2A", "#1F1F1F", "#141414"];

  return (
    <Animated.View style={[styles.container, panelStyle]}>
      <LinearGradient colors={gradientColors} style={styles.gradient}>
        <View style={styles.content}>
          {/* En-tête */}
          <View style={styles.header}>
            <Text
              style={[
                styles.title,
                { color: isWinner ? "#A3D977" : colors.mutedForeground },
              ]}
            >
              {isWinner ? getVictoryTitle() : "Défaite"}
            </Text>
            {isWinner && multiplier > 1 && (
              <Badge label={`×${multiplier}`} variant="kora" />
            )}
          </View>

          {/* Stats */}
          <View style={styles.stats}>
            {isWinner ?
              <>
                <View style={styles.statRow}>
                  <Text
                    style={[
                      styles.statLabel,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    Gains
                  </Text>
                  <Text style={[styles.statValue, { color: "#A3D977" }]}>
                    +{Math.round(winnings)} {game.bet.currency}
                  </Text>
                </View>
                {multiplier > 1 && (
                  <View style={styles.statRow}>
                    <Text
                      style={[
                        styles.statLabel,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      Multiplicateur
                    </Text>
                    <Text
                      style={[styles.statValue, { color: colors.secondary }]}
                    >
                      ×{multiplier}
                    </Text>
                  </View>
                )}
              </>
            : <View style={styles.statRow}>
                <Text
                  style={[styles.statLabel, { color: colors.mutedForeground }]}
                >
                  Perte
                </Text>
                <Text style={[styles.statValue, { color: colors.destructive }]}>
                  -{game.bet.amount} {game.bet.currency}
                </Text>
              </View>
            }
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              title="Accueil"
              onPress={onGoHome}
              variant="secondary"
              style={styles.button}
            />
            <Button
              title="Rejouer"
              onPress={onPlayAgain}
              variant="primary"
              style={styles.button}
            />
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: PANEL_HEIGHT,
    zIndex: 1000,
  },
  gradient: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
  },
  content: {
    flex: 1,
    padding: 24,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
  },
  stats: {
    gap: 12,
    marginBottom: 24,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
  },
});
