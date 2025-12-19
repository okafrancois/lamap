import { Button } from "@/components/ui/Button";
import { useSound } from "@/hooks/useSound";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
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
  const { playSound } = useSound();
  const soundPlayedRef = useRef(false);
  const [countedGains, setCountedGains] = useState(0);

  const translateY = useSharedValue(PANEL_HEIGHT);
  const opacity = useSharedValue(0);
  const starScale1 = useSharedValue(1);
  const starScale2 = useSharedValue(1);
  const starScale3 = useSharedValue(1);

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
    if (game.victoryType === "triple_kora") return "333 EXPORT !";
    if (game.victoryType === "double_kora") return "33 EXPORT !";
    if (game.victoryType === "simple_kora") return "KORA !";
    if (game.victoryType === "auto_sum") return "Auto-victoire (Somme)";
    if (game.victoryType === "auto_sevens") return "Auto-victoire (7)";
    if (game.victoryType === "auto_lowest") return "Auto-victoire";
    return "Victoire 🎉 !";
  };

  const isKoraWin =
    game.victoryType === "simple_kora" ||
    game.victoryType === "double_kora" ||
    game.victoryType === "triple_kora";

  const getStarCount = () => {
    if (game.victoryType === "triple_kora") return 3;
    if (game.victoryType === "double_kora") return 2;
    if (game.victoryType === "simple_kora") return 1;
    return 0;
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

      // Animation des étoiles
      if (isKoraWin) {
        starScale1.value = withRepeat(
          withSequence(
            withTiming(1.2, { duration: 750 }),
            withTiming(1, { duration: 750 })
          ),
          -1,
          false
        );
        starScale2.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 150 }),
            withTiming(1.2, { duration: 750 }),
            withTiming(1, { duration: 750 })
          ),
          -1,
          false
        );
        starScale3.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 300 }),
            withTiming(1.2, { duration: 750 }),
            withTiming(1, { duration: 750 })
          ),
          -1,
          false
        );
      }

      // Animation compteur de gains
      if (isWinner) {
        const duration = 1200;
        const steps = 30;
        const increment = winnings / steps;
        let current = 0;
        const timer = setInterval(() => {
          current += increment;
          if (current >= winnings) {
            setCountedGains(Math.round(winnings));
            clearInterval(timer);
          } else {
            setCountedGains(Math.floor(current));
          }
        }, duration / steps);
        return () => clearInterval(timer);
      }
    } else {
      translateY.value = withTiming(PANEL_HEIGHT, {
        duration: 250,
        easing: Easing.in(Easing.ease),
      });
      opacity.value = withTiming(0, { duration: 200 });
      soundPlayedRef.current = false;
      setCountedGains(0);
    }
  }, [
    visible,
    translateY,
    opacity,
    isWinner,
    winnings,
    isKoraWin,
    starScale1,
    starScale2,
    starScale3,
  ]);

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

  const star1Style = useAnimatedStyle(() => ({
    transform: [{ scale: starScale1.value }],
  }));

  const star2Style = useAnimatedStyle(() => ({
    transform: [{ scale: starScale2.value }],
  }));

  const star3Style = useAnimatedStyle(() => ({
    transform: [{ scale: starScale3.value }],
  }));

  return (
    <Animated.View style={[styles.container, panelStyle]}>
      <LinearGradient
        colors={["#2E3D4D", "#3A4D5F", "#2E3D4D"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.panel}
      >
        {/* Coins décoratifs vintage */}
        <View style={styles.cornerTL} />
        <View style={styles.cornerTR} />
        <View style={styles.cornerBL} />
        <View style={styles.cornerBR} />

        <View style={styles.content}>
          {/* Étoiles pour Kora */}
          {isWinner && isKoraWin && (
            <View style={styles.starsContainer}>
              {getStarCount() >= 1 && (
                <Animated.Text style={[styles.star, star1Style]}>
                  ★
                </Animated.Text>
              )}
              {getStarCount() >= 2 && (
                <Animated.Text style={[styles.star, star2Style]}>
                  ★
                </Animated.Text>
              )}
              {getStarCount() >= 3 && (
                <Animated.Text style={[styles.star, star3Style]}>
                  ★
                </Animated.Text>
              )}
            </View>
          )}

          {/* Titre */}
          <Text
            style={[
              styles.title,
              {
                color: isWinner && isKoraWin ? "#A68258" : "#F5F2ED",
                textShadowColor:
                  isWinner && isKoraWin ?
                    "rgba(166, 130, 88, 0.5)"
                  : "transparent",
              },
            ]}
          >
            {isWinner ? getVictoryTitle() : "Défaite"}
          </Text>

          {/* Multiplicateur Kora */}
          {isWinner && multiplier > 1 && (
            <Text style={styles.multiplier}>×{multiplier}</Text>
          )}

          {/* Séparateur décoratif */}
          <View style={styles.separator}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorDiamond}>◆</Text>
            <View style={styles.separatorLine} />
          </View>

          {/* Gains */}
          <View style={styles.gainsContainer}>
            <Text style={styles.gainsLabel}>
              {isWinner ? "Gains" : "Perte"}
            </Text>
            <Text
              style={[
                styles.gainsValue,
                { color: isWinner ? "#7CB342" : "#E63946" },
              ]}
            >
              {isWinner ? "+" : "-"}
              {isWinner ? countedGains.toLocaleString() : game.bet.amount}{" "}
              {game.bet.currency}
            </Text>
          </View>

          {/* Boutons */}
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
  panel: {
    flex: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 2,
    borderColor: "#A68258",
    borderBottomWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 20,
  },
  // Coins décoratifs vintage
  cornerTL: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 20,
    height: 20,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: "#A68258",
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: "#A68258",
    borderTopRightRadius: 4,
  },
  cornerBL: {
    position: "absolute",
    bottom: 8,
    left: 8,
    width: 20,
    height: 20,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: "#A68258",
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 20,
    height: 20,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: "#A68258",
    borderBottomRightRadius: 4,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  star: {
    color: "#A68258",
    fontSize: 28,
    textShadowColor: "rgba(166, 130, 88, 0.6)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 2,
    marginBottom: 8,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  multiplier: {
    fontSize: 24,
    fontWeight: "700",
    color: "#A68258",
    textAlign: "center",
    marginBottom: 16,
    textShadowColor: "rgba(166, 130, 88, 0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  separator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginVertical: 20,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#A68258",
    opacity: 0.5,
  },
  separatorDiamond: {
    color: "#A68258",
    fontSize: 12,
  },
  gainsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingHorizontal: 20,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 8,
    marginBottom: 24,
  },
  gainsLabel: {
    fontSize: 12,
    color: "#8A9BA8",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "600",
  },
  gainsValue: {
    fontSize: 24,
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
