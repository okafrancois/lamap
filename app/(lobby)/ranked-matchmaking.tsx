import { RankProgress } from "@/components/ranking/RankProgress";
import { Button } from "@/components/ui/Button";
import { api } from "@/convex/_generated/api";
import type { Currency } from "@/convex/currencies";
import { INITIAL_PR } from "@/convex/ranking";
import { useAuth } from "@/hooks/useAuth";
import { useColors } from "@/hooks/useColors";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RankedMatchmakingScreen() {
  const colors = useColors();
  const router = useRouter();
  const { userId, convexUser } = useAuth();
  const [searching, setSearching] = useState(false);
  const [searchTime, setSearchTime] = useState(0);

  const joinQueue = useMutation(api.matchmaking.joinQueue);
  const leaveQueue = useMutation(api.matchmaking.leaveQueue);

  const queueStatus = useQuery(
    api.matchmaking.getMyStatus,
    userId && convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  const userPR = convexUser?.pr || INITIAL_PR;
  const currency = (convexUser?.currency || "XAF") as Currency;

  // Calculer le range PR selon le temps d'attente
  const getPRRange = () => {
    if (searchTime < 30) return 100;
    if (searchTime < 60) return 200;
    return 300;
  };

  const prRange = getPRRange();

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (queueStatus?.status === "searching") {
      setSearching(true);
      interval = setInterval(() => {
        setSearchTime((prev) => prev + 1);
      }, 1000);
    } else if (queueStatus?.status === "matched" && queueStatus.gameId) {
      router.replace(`/(game)/match/${queueStatus.gameId}`);
    } else {
      setSearching(false);
      setSearchTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [queueStatus, router]);

  const handleStartSearch = async () => {
    if (!convexUser?._id) return;

    try {
      setSearching(true);
      await joinQueue({
        userId: convexUser._id,
        betAmount: 0, // Gratuit pour le mode classé
        currency,
        mode: "RANKED",
        competitive: true, // Toujours compétitif pour le mode classé
      });
    } catch (error) {
      console.error("Erreur lors de la recherche:", error);
      setSearching(false);
    }
  };

  const handleCancelSearch = async () => {
    if (!convexUser?._id) return;

    try {
      await leaveQueue({ userId: convexUser._id });
      setSearching(false);
      setSearchTime(0);
    } catch (error) {
      console.error("Erreur lors de l'annulation:", error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: 24,
      paddingTop: 40,
    },
    header: {
      marginBottom: 32,
    },
    title: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.mutedForeground,
      textAlign: "center",
    },
    rankCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 24,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
    },
    searchingIndicator: {
      marginBottom: 20,
    },
    searchTime: {
      fontSize: 32,
      fontWeight: "700",
      color: colors.secondary,
      marginBottom: 8,
    },
    searchStatus: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 4,
      textAlign: "center",
    },
    searchRange: {
      fontSize: 14,
      color: colors.mutedForeground,
      textAlign: "center",
      marginBottom: 20,
    },
    infoCard: {
      backgroundColor: colors.muted,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
    },
    infoTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 12,
    },
    infoItem: {
      fontSize: 14,
      color: colors.mutedForeground,
      marginBottom: 8,
      lineHeight: 20,
    },
    buttonContainer: {
      gap: 12,
    },
    backButton: {
      marginTop: 12,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Mode Classé</Text>
            <Text style={styles.subtitle}>Gratuit • Matchmaking par rang</Text>
          </View>

          <View style={styles.rankCard}>
            <RankProgress pr={userPR} showDetails />
          </View>

          {searching ?
            <View style={styles.searchCard}>
              <ActivityIndicator
                size="large"
                color={colors.secondary}
                style={styles.searchingIndicator}
              />
              <Text style={styles.searchTime}>{formatTime(searchTime)}</Text>
              <Text style={styles.searchStatus}>
                Recherche d&apos;un adversaire...
              </Text>
              <Text style={styles.searchRange}>
                Range: ±{prRange} PR ({userPR - prRange} - {userPR + prRange})
              </Text>
              <Button
                title="Annuler"
                onPress={handleCancelSearch}
                variant="destructive"
              />
            </View>
          : <>
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>
                  Comment fonctionne le mode Classé ?
                </Text>
                <Text style={styles.infoItem}>
                  • Parties gratuites (0 mise)
                </Text>
                <Text style={styles.infoItem}>
                  • Matchmaking progressif par PR :{"\n"} - 0-30s: ±100 PR{"\n"}
                  {"  "}- 30-60s: ±200 PR{"\n"} - 60s+: ±300 PR
                </Text>
                <Text style={styles.infoItem}>
                  • Gagner augmente votre PR, perdre le diminue
                </Text>
                <Text style={styles.infoItem}>
                  • Montez de rang pour débloquer des récompenses Kora
                </Text>
              </View>

              <View style={styles.buttonContainer}>
                <Button
                  title="Lancer la recherche"
                  onPress={handleStartSearch}
                  variant="primary"
                />
                <Button
                  title="Retour"
                  onPress={() => router.back()}
                  variant="ghost"
                  style={styles.backButton}
                />
              </View>
            </>
          }
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
