import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Colors } from "@/constants/theme";
import { useMatchmaking } from "@/hooks/useMatchmaking";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MatchmakingScreen() {
  const router = useRouter();
  const { betAmount } = useLocalSearchParams<{ betAmount: string }>();
  const { status, opponent, gameId, joinQueue, leaveQueue, timeInQueue } =
    useMatchmaking();
  const pulseScale = useSharedValue(1);

  const bet = betAmount ? parseInt(betAmount, 10) : 0;

  useEffect(() => {
    if (bet > 0 && status === "idle") {
      joinQueue(bet, "XAF").catch((error) => {
        Alert.alert(
          "Erreur de connexion",
          "Impossible de rejoindre la file d'attente. Vérifiez votre connexion et réessayez."
        );
        console.error("Error joining queue:", error);
      });
    }
  }, [bet, status, joinQueue]);

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

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.content}>
        {status === "searching" && (
          <>
            <Animated.View style={[styles.searchIcon, pulseAnimatedStyle]}>
              <ActivityIndicator size="large" color={Colors.primary.gold} />
            </Animated.View>
            <Text style={styles.title}>Recherche d&apos;adversaire...</Text>
            <Text style={styles.subtitle}>Mise: {bet} Kora</Text>
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
            <Text style={styles.subtitle}>Mise: {bet} Kora</Text>
          </>
        )}

        {status === "idle" && (
          <>
            <ActivityIndicator size="large" color={Colors.primary.gold} />
            <Text style={styles.title}>Préparation...</Text>
          </>
        )}
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
    alignItems: "center",
    padding: 24,
  },
  searchIcon: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.derived.white,
    textAlign: "center",
    marginBottom: 16,
  },
  foundTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.primary.gold,
    textAlign: "center",
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.derived.blueLight,
    textAlign: "center",
    marginBottom: 8,
  },
  timeText: {
    fontSize: 16,
    color: Colors.derived.blueLight,
    textAlign: "center",
    marginBottom: 32,
  },
  opponentName: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.derived.white,
    marginTop: 16,
    marginBottom: 8,
  },
  cancelButton: {
    marginTop: 32,
    minWidth: 200,
  },
});
