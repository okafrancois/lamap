import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useColors } from "@/hooks/useColors";
import { useSound } from "@/hooks/useSound";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RoomScreen() {
  const colors = useColors();
  const router = useRouter();
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const { userId } = useAuth();
  const user = useQuery(
    api.users.getCurrentUser,
    userId ? { clerkUserId: userId } : "skip"
  );
  const myUserId = user?._id;
  const startGame = useMutation(api.games.startGame);
  const { playSound } = useSound();

  const game = useQuery(
    api.games.getGame,
    roomId ? { gameId: roomId } : "skip"
  );

  const [countdown, setCountdown] = useState<number | null>(null);
  const previousGameStatus = useRef<string | undefined>(undefined);
  const startTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasStartedTimerRef = useRef(false);

  const player1Opacity = useSharedValue(0);
  const player1Scale = useSharedValue(0.8);
  const player2Opacity = useSharedValue(0);
  const player2Scale = useSharedValue(0.8);

  // Son quand la partie démarre (détection du changement de status)
  useEffect(() => {
    if (
      previousGameStatus.current !== "PLAYING" &&
      game?.status === "PLAYING"
    ) {
      playSound("gameStart");
      router.replace(`/(game)/match/${roomId}`);
    }
    previousGameStatus.current = game?.status;
  }, [game?.status, roomId, router, playSound]);

  // Démarrage automatique 3 secondes après le match
  useEffect(() => {
    if (
      game?.status === "WAITING" &&
      game.players.length >= 2 &&
      !hasStartedTimerRef.current
    ) {
      hasStartedTimerRef.current = true;
      setCountdown(3);

      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      const timeout = setTimeout(async () => {
        try {
          if (game?.status === "WAITING") {
            await startGame({ gameId: game.gameId });
          }
        } catch (error: any) {
          if (error?.message?.includes("Game already started")) {
            console.log("Game already started by another player");
          } else {
            console.error("Error starting game:", error);
            hasStartedTimerRef.current = false;
            setCountdown(null);
          }
        }
        clearInterval(interval);
      }, 3000);

      startTimerRef.current = timeout;

      return () => {
        clearTimeout(timeout);
        clearInterval(interval);
      };
    }
  }, [game?.status, game?.players.length, game?.gameId, startGame]);

  // Réinitialiser le timer si le statut change
  useEffect(() => {
    if (game?.status !== "WAITING") {
      if (startTimerRef.current) {
        clearTimeout(startTimerRef.current);
        startTimerRef.current = null;
      }
      hasStartedTimerRef.current = false;
      setCountdown(null);
    }
  }, [game?.status]);

  useEffect(() => {
    player1Opacity.value = withDelay(100, withTiming(1, { duration: 300 }));
    player1Scale.value = withDelay(100, withTiming(1, { duration: 300 }));
  }, [player1Opacity, player1Scale]);

  const me = game?.players.find((p) => p.userId === myUserId);
  const opponent = game?.players.find((p) => p.userId !== myUserId);

  useEffect(() => {
    if (opponent) {
      player2Opacity.value = withDelay(300, withTiming(1, { duration: 300 }));
      player2Scale.value = withDelay(300, withTiming(1, { duration: 300 }));
    }
  }, [opponent, player2Opacity, player2Scale]);

  const player1AnimatedStyle = useAnimatedStyle(() => ({
    opacity: player1Opacity.value,
    transform: [{ scale: player1Scale.value }],
  }));

  const player2AnimatedStyle = useAnimatedStyle(() => ({
    opacity: player2Opacity.value,
    transform: [{ scale: player2Scale.value }],
  }));

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      justifyContent: "center",
      padding: 24,
    },
    loadingText: {
      color: colors.text,
      marginTop: 16,
      fontSize: 16,
    },
    title: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 18,
      color: colors.secondary,
      textAlign: "center",
      marginBottom: 48,
      fontWeight: "600",
    },
    players: {
      alignItems: "center",
      marginBottom: 48,
    },
    playerCard: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 24,
      minWidth: 200,
      marginVertical: 16,
    },
    playerName: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      marginTop: 12,
    },
    vs: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.secondary,
      marginVertical: 16,
    },
    waitingText: {
      fontSize: 16,
      color: colors.mutedForeground,
      marginTop: 12,
      textAlign: "center",
    },
    countdownText: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.secondary,
      textAlign: "center",
      marginTop: 12,
    },
    readySection: {
      alignItems: "center",
      marginBottom: 24,
    },
    leaveButton: {
      marginTop: 16,
    },
  });

  if (!game) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <ActivityIndicator size="large" color={colors.secondary} />
        <Text style={styles.loadingText}>Chargement de la salle...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={styles.content}>
        <Text style={styles.title}>Salle d&apos;attente</Text>
        <Text style={styles.subtitle}>
          Mise: {game.bet.amount} {game.bet.currency}
        </Text>

        <View style={styles.players}>
          <Animated.View style={[styles.playerCard, player1AnimatedStyle]}>
            <Avatar name={me?.username || "Vous"} size={60} />
            <Text style={styles.playerName}>{me?.username || "Vous"}</Text>
          </Animated.View>

          <Text style={styles.vs}>VS</Text>

          <Animated.View style={[styles.playerCard, player2AnimatedStyle]}>
            {opponent ?
              <>
                <Avatar name={opponent.username} size={60} />
                <Text style={styles.playerName}>{opponent.username}</Text>
              </>
            : <>
                <ActivityIndicator size="small" color={colors.secondary} />
                <Text style={styles.waitingText}>En attente...</Text>
              </>
            }
          </Animated.View>
        </View>

        {countdown !== null && countdown > 0 && (
          <View style={styles.readySection}>
            <Text style={styles.countdownText}>
              Démarrage dans {countdown}...
            </Text>
          </View>
        )}

        {game.players.length >= 2 &&
          countdown === null &&
          game.status === "WAITING" && (
            <View style={styles.readySection}>
              <Text style={styles.waitingText}>
                Préparation de la partie...
              </Text>
            </View>
          )}

        <Button
          title="Quitter"
          onPress={() => router.back()}
          variant="ghost"
          style={styles.leaveButton}
        />
      </View>
    </SafeAreaView>
  );
}
