import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useColors } from "@/hooks/useColors";
import { useMatchmaking } from "@/hooks/useMatchmaking";
import { useSound } from "@/hooks/useSound";
import { useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MatchmakingScreen() {
  const colors = useColors();
  const router = useRouter();
  const { betAmount } = useLocalSearchParams<{ betAmount: string }>();
  const { userId } = useAuth();
  const user = useQuery(
    api.users.getCurrentUser,
    userId ? { clerkUserId: userId } : "skip"
  );
  const { status, opponent, gameId, joinQueue, leaveQueue, timeInQueue } =
    useMatchmaking();
  const { playSound } = useSound();
  const pulseScale = useSharedValue(1);
  const previousStatus = useRef<string | undefined>(undefined);

  const bet = betAmount ? parseInt(betAmount, 10) : 0;
  const currency = (user?.currency || "XAF") as "EUR" | "XAF";

  useEffect(() => {
    if (bet > 0 && status === "idle" && user) {
      joinQueue(bet, currency)
        .then(() => {
          playSound("confirmation");
        })
        .catch((error) => {
          Alert.alert(
            "Erreur de connexion",
            "Impossible de rejoindre la file d'attente. Vérifiez votre connexion et réessayez."
          );
          console.error("Error joining queue:", error);
        });
    }
  }, [bet, status, joinQueue, playSound, user, currency]);

  // Son quand un adversaire est trouvé
  useEffect(() => {
    if (previousStatus.current !== "matched" && status === "matched") {
      playSound("gameStart");
    }
    previousStatus.current = status;
  }, [status, playSound]);

  useEffect(() => {
    if (status === "searching") {
      pulseScale.value = withRepeat(
        withTiming(1.15, { duration: 800 }),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 200 });
    }
  }, [status, pulseScale]);

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  useEffect(() => {
    if (status === "matched" && gameId) {
      router.replace(`/(lobby)/room/${gameId}`);
    }
  }, [status, gameId, router]);

  const handleCancel = async () => {
    await leaveQueue();
    router.back();
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    searchIcon: {
      marginBottom: 32,
    },
    title: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
      marginBottom: 16,
    },
    foundTitle: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.secondary,
      textAlign: "center",
      marginBottom: 24,
    },
    subtitle: {
      fontSize: 18,
      color: colors.mutedForeground,
      textAlign: "center",
      marginBottom: 8,
    },
    timeText: {
      fontSize: 16,
      color: colors.mutedForeground,
      textAlign: "center",
      marginBottom: 32,
    },
    opponentName: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    cancelButton: {
      marginTop: 32,
      minWidth: 200,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={styles.content}>
        {status === "searching" && (
          <>
            <Animated.View style={[styles.searchIcon, pulseAnimatedStyle]}>
              <ActivityIndicator size="large" color={colors.secondary} />
            </Animated.View>
            <Text style={styles.title}>Recherche d&apos;adversaire...</Text>
            <Text style={styles.subtitle}>
              Mise: {bet} {currency}
            </Text>
            <Text style={styles.timeText}>
              Temps écoulé: {formatTime(timeInQueue)}
            </Text>
            <Button
              title="Annuler"
              onPress={handleCancel}
              variant="secondary"
              style={styles.cancelButton}
            />
          </>
        )}

        {status === "matched" && opponent && (
          <>
            <Text style={styles.foundTitle}>Adversaire trouvé !</Text>
            <Avatar name={opponent.username} size={80} />
            <Text style={styles.opponentName}>{opponent.username}</Text>
            <Text style={styles.subtitle}>
              Mise: {bet} {currency}
            </Text>
          </>
        )}

        {status === "idle" && (
          <>
            <ActivityIndicator size="large" color={colors.secondary} />
            <Text style={styles.title}>Préparation...</Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
