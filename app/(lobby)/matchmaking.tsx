import { BattleZone } from "@/components/game/BattleZone";
import { OpponentZone } from "@/components/game/OpponentZone";
import { PlaceholderCardHand } from "@/components/game/PlaceholderCardHand";
import { Button } from "@/components/ui/Button";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useColors } from "@/hooks/useColors";
import { useMatchmaking } from "@/hooks/useMatchmaking";
import { useSettings } from "@/hooks/useSettings";
import { useSound } from "@/hooks/useSound";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MatchmakingScreen() {
  const colors = useColors();
  const router = useRouter();
  const { betAmount, competitive } = useLocalSearchParams<{
    betAmount: string;
    competitive?: string;
  }>();
  const { userId } = useAuth();
  const { battleLayout, timerEnabled, timerDuration } = useSettings();
  const user = useQuery(
    api.users.getCurrentUser,
    userId ? { clerkUserId: userId } : "skip"
  );
  const { status, opponent, gameId, joinQueue, leaveQueue, timeInQueue } =
    useMatchmaking();
  const { playSound } = useSound();
  const previousStatus = useRef<string | undefined>(undefined);

  const bet = betAmount ? parseInt(betAmount, 10) : 0;
  const isCompetitive = competitive === "true";
  const currency = (user?.currency || "XAF") as "EUR" | "XAF" | "USD";

  useEffect(() => {
    if (bet > 0 && status === "idle" && user) {
      joinQueue(
        bet,
        currency,
        "CASH",
        isCompetitive,
        timerEnabled,
        timerDuration
      )
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
  }, [
    bet,
    status,
    joinQueue,
    playSound,
    user,
    currency,
    isCompetitive,
    timerEnabled,
    timerDuration,
  ]);

  useEffect(() => {
    if (previousStatus.current !== "matched" && status === "matched") {
      playSound("gameStart");
    }
    previousStatus.current = status;
  }, [status, playSound]);

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
    timeText: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontWeight: "500",
    },
    playArea: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    handArea: {
      backgroundColor: colors.card,
      borderTopWidth: 2,
      borderTopColor: colors.border,
      position: "relative",
    },
    cancelButtonContainer: {
      padding: 16,
      paddingBottom: 24,
    },
    searchingIndicator: {
      alignItems: "center",
      gap: 12,
      zIndex: 10,
      transform: [{ translateY: -40 }],
    },
    searchingText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.mutedForeground,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            {bet > 0 && (
              <View style={styles.betBadge}>
                <Ionicons
                  name="trophy"
                  size={12}
                  color={colors.secondaryForeground}
                />
                <Text style={styles.betText}>
                  {bet} {currency}
                </Text>
              </View>
            )}
            {status === "searching" && (
              <Text style={styles.timeText}>
                Temps: {formatTime(timeInQueue)}
              </Text>
            )}
          </View>
        </View>
      </View>

      <OpponentZone
        name={
          status === "matched" && opponent ? opponent.username
          : status === "searching" ?
            "Recherche d'adversaire..."
          : "En attente..."
        }
        hasHand={false}
        cardsRemaining={5}
      />

      <View style={styles.playArea}>
        <BattleZone
          opponentCards={[]}
          playerCards={[]}
          battleLayout={battleLayout}
        />
        {status === "searching" && (
          <View style={styles.searchingIndicator}>
            <ActivityIndicator size="large" color={colors.secondary} />
            <Text style={styles.searchingText}>En recherche...</Text>
          </View>
        )}
      </View>

      <View style={styles.handArea}>
        <PlaceholderCardHand cardCount={5} />
        <View style={styles.cancelButtonContainer}>
          <Button title="Annuler" onPress={handleCancel} variant="secondary" />
        </View>
      </View>
    </SafeAreaView>
  );
}
