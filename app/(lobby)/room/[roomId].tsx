import { BattleZone } from "@/components/game/BattleZone";
import { OpponentZone } from "@/components/game/OpponentZone";
import { PlaceholderCardHand } from "@/components/game/PlaceholderCardHand";
import { Button } from "@/components/ui/Button";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useColors } from "@/hooks/useColors";
import { useSettings } from "@/hooks/useSettings";
import { useSound } from "@/hooks/useSound";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import {
  type ErrorBoundaryProps,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const colors = useColors();
  const router = useRouter();

  const errorStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
      gap: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: "700",
      textAlign: "center",
      color: colors.text,
    },
    message: {
      fontSize: 16,
      textAlign: "center",
      lineHeight: 22,
      maxWidth: 300,
      color: colors.mutedForeground,
    },
    actions: {
      flexDirection: "row",
      gap: 12,
      marginTop: 8,
    },
    button: {
      minWidth: 120,
    },
  });

  return (
    <SafeAreaView style={errorStyles.container}>
      <View style={errorStyles.content}>
        <Ionicons name="alert-circle" size={64} color={colors.destructive} />
        <Text style={errorStyles.title}>Erreur de chargement</Text>
        <Text style={errorStyles.message}>{error.message}</Text>
        <View style={errorStyles.actions}>
          <Button
            title="Réessayer"
            onPress={retry}
            variant="primary"
            style={errorStyles.button}
          />
          <Button
            title="Retour"
            onPress={() => router.back()}
            variant="outline"
            style={errorStyles.button}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

export default function RoomScreen() {
  const colors = useColors();
  const router = useRouter();
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const { userId } = useAuth();
  const { battleLayout } = useSettings();
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
  const currentGameIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (game?.gameId && game.gameId !== currentGameIdRef.current) {
      currentGameIdRef.current = game.gameId;
      hasStartedTimerRef.current = false;
      setCountdown(null);
    }
  }, [game?.gameId]);

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

  useEffect(() => {
    if (
      game?.status === "WAITING" &&
      game?.players &&
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
          } else {
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
  }, [
    game?.status,
    game?.gameId,
    game?.players.length,
    startGame,
    game?.players,
  ]);

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

  const opponent = game?.players.find((p) => p.userId !== myUserId);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerContent: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    betBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: colors.secondary,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    betText: {
      fontSize: 12,
      color: colors.secondaryForeground,
      fontWeight: "600",
    },
    playArea: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    handArea: {
      backgroundColor: colors.card,
      paddingTop: 16,
      borderTopWidth: 2,
      borderTopColor: colors.border,
      position: "relative",
    },
    quitButtonContainer: {
      padding: 16,
      paddingBottom: 24,
    },
    countdownOverlay: {
      position: "absolute",
      top: "50%",
      left: 0,
      right: 0,
      alignItems: "center",
      gap: 12,
      zIndex: 10,
      transform: [{ translateY: -60 }],
    },
    countdownText: {
      fontSize: 48,
      fontWeight: "700",
      color: colors.secondary,
    },
    countdownLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.mutedForeground,
    },
    loadingText: {
      color: colors.text,
      marginTop: 16,
      fontSize: 16,
    },
  });

  if (!game) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.playArea}>
          <ActivityIndicator size="large" color={colors.secondary} />
          <Text style={styles.loadingText}>Chargement de la salle...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            {game.bet.amount > 0 && (
              <View style={styles.betBadge}>
                <Ionicons
                  name="trophy"
                  size={12}
                  color={colors.secondaryForeground}
                />
                <Text style={styles.betText}>
                  {game.bet.amount} {game.bet.currency}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <OpponentZone
        name={opponent ? opponent.username : "?"}
        hasHand={false}
        cardsRemaining={5}
      />

      <View style={styles.playArea}>
        {countdown !== null && countdown > 0 && (
          <View style={styles.countdownOverlay}>
            <Text style={styles.countdownText}>{countdown}</Text>
            <Text style={styles.countdownLabel}>Démarrage...</Text>
          </View>
        )}

        {!opponent && (
          <View style={styles.countdownOverlay}>
            <ActivityIndicator size="large" color={colors.secondary} />
            <Text style={styles.countdownLabel}>
              En attente d&apos;un adversaire
            </Text>
          </View>
        )}

        <BattleZone
          opponentCards={[]}
          playerCards={[]}
          battleLayout={battleLayout}
        />
      </View>

      <View style={styles.handArea}>
        <PlaceholderCardHand cardCount={5} />
        <View style={styles.quitButtonContainer}>
          <Button
            title="Quitter"
            onPress={() => router.back()}
            variant="outline"
            size="sm"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
