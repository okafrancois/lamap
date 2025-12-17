import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useColors } from "@/hooks/useColors";
import { useSound } from "@/hooks/useSound";
import React, { useEffect, useRef } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

interface ResultModalProps {
  visible: boolean;
  game: {
    winnerId: string | null;
    victoryType: string | null;
    bet: { amount: number; currency: string };
    players: { userId: string | null; balance: number }[];
  };
  myUserId: string | null;
  onClose: () => void;
  onGoHome: () => void;
}

export function ResultModal({
  visible,
  game,
  myUserId,
  onClose,
  onGoHome,
}: ResultModalProps) {
  const colors = useColors();
  const { playSound } = useSound();
  const soundPlayedRef = useRef(false);

  const cardOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.8);
  const modalOpacity = useSharedValue(0);

  const isWinner = game.winnerId === myUserId;
  const totalBet = game.bet.amount * 2;
  const platformFee = totalBet * 0.02;

  // Calculate net winnings (what the player wins minus fees)
  const opponentBet = game.bet.amount;
  let winnings = 0;

  if (isWinner) {
    if (game.victoryType === "triple_kora") {
      winnings = opponentBet * 8 - platformFee;
    } else if (game.victoryType === "double_kora") {
      winnings = opponentBet * 4 - platformFee;
    } else if (game.victoryType === "simple_kora") {
      winnings = opponentBet * 2 - platformFee;
    } else {
      // Normal victory or any other type: win opponent's bet minus commission
      winnings = opponentBet - platformFee;
    }
  }

  useEffect(() => {
    if (visible) {
      cardOpacity.value = withTiming(1, { duration: 300 });
      cardScale.value = withSpring(1, { damping: 15, stiffness: 150 });
      modalOpacity.value = withTiming(1, { duration: 200 });
    } else {
      cardOpacity.value = withTiming(0, { duration: 200 });
      cardScale.value = withTiming(0.8, { duration: 200 });
      modalOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible, cardOpacity, cardScale, modalOpacity]);

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
          game.victoryType === "auto_sevens"
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

  useEffect(() => {
    if (!visible) {
      soundPlayedRef.current = false;
    }
  }, [visible]);

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

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value * 0.5,
  }));

  const styles = StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0, 0, 0, 0.8)",
    },
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    resultCard: {
      borderRadius: 16,
      padding: 24,
      width: "100%",
      maxWidth: 400,
      borderWidth: 3,
    },
    winnerCard: {
      backgroundColor: colors.card,
      borderColor: colors.secondary,
    },
    loserCard: {
      backgroundColor: colors.card,
      borderColor: colors.primary,
    },
    resultTitle: {
      fontSize: 25,
      fontWeight: "700",
      color: colors.text,
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
      marginBottom: 24,
    },
    statRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    totalRow: {
      borderTopWidth: 2,
      borderTopColor: colors.secondary,
      borderBottomWidth: 0,
      marginTop: 8,
      paddingTop: 16,
    },
    statLabel: {
      fontSize: 16,
      color: colors.mutedForeground,
    },
    statValue: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },
    totalLabel: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.secondary,
    },
    totalValue: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.secondary,
    },
    actions: {
      gap: 12,
    },
    button: {
      minHeight: 56,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.backdrop, backdropStyle]} />
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.resultCard,
            isWinner ? styles.winnerCard : styles.loserCard,
            cardAnimatedStyle,
          ]}
        >
          <Text style={styles.resultTitle}>
            {isWinner ? "🎉 Vous avez gagné !" : "💀 Vous avez perdu"}
          </Text>

          {isWinner && (
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
          )}

          {game.bet.amount > 0 && (
            <View style={styles.statsContainer}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Mise totale</Text>
                <Text style={styles.statValue}>
                  {totalBet} {game.bet.currency}
                </Text>
              </View>
              {isWinner ?
                <>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Commission (2%)</Text>
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
                      {Math.round(winnings)} {game.bet.currency}
                    </Text>
                  </View>
                </>
              : <View style={[styles.statRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Perte</Text>
                  <Text style={[styles.totalValue, { color: colors.primary }]}>
                    -{game.bet.amount} {game.bet.currency}
                  </Text>
                </View>
              }
            </View>
          )}

          <View style={styles.actions}>
            <Button
              title="Rejouer"
              onPress={onGoHome}
              variant="primary"
              style={styles.button}
            />
            <Button
              title="Retour à l'accueil"
              onPress={onClose}
              variant="secondary"
              style={styles.button}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
