import { Button } from "@/components/ui/Button";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useColors } from "@/hooks/useColors";
import { useMatchmaking } from "@/hooks/useMatchmaking";
import { useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const DIFFICULTIES = [
  { value: "easy", label: "Facile" },
  { value: "medium", label: "Moyen" },
  { value: "hard", label: "Difficile" },
];

export default function SelectDifficultyScreen() {
  const colors = useColors();
  const router = useRouter();
  const { betAmount } = useLocalSearchParams<{ betAmount: string }>();
  const { userId } = useAuth();
  const user = useQuery(
    api.users.getCurrentUser,
    userId ? { clerkUserId: userId } : "skip"
  );
  const { createMatchVsAI } = useMatchmaking();
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  const bet = betAmount ? parseInt(betAmount, 10) : 0;
  const currency = (user?.currency || "XAF") as "EUR" | "XAF";

  const handleStart = async () => {
    if (!selectedDifficulty) return;

    setLoading(true);
    try {
      const gameId = await createMatchVsAI(
        bet,
        selectedDifficulty as "easy" | "medium" | "hard",
        currency
      );
      router.replace(`/(game)/match/${gameId}`);
    } catch (error) {
      console.error("Error creating match vs AI:", error);
    } finally {
      setLoading(false);
    }
  };

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
    title: {
      fontSize: 32,
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
    options: {
      gap: 16,
      marginBottom: 32,
    },
    difficultyButton: {
      minHeight: 64,
    },
    selectedDifficulty: {
      borderWidth: 3,
      borderColor: colors.secondary,
    },
    actions: {
      gap: 12,
    },
    startButton: {
      minHeight: 56,
    },
    backButton: {
      marginTop: 8,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={styles.content}>
        <Text style={styles.title}>Choisir la difficulté</Text>
        <Text style={styles.subtitle}>Partie gratuite</Text>

        <View style={styles.options}>
          {DIFFICULTIES.map((difficulty) => (
            <Button
              key={difficulty.value}
              title={difficulty.label}
              onPress={() => setSelectedDifficulty(difficulty.value)}
              variant={
                selectedDifficulty === difficulty.value ?
                  "primary"
                : "secondary"
              }
              style={
                selectedDifficulty === difficulty.value ?
                  [styles.difficultyButton, styles.selectedDifficulty]
                : styles.difficultyButton
              }
            />
          ))}
        </View>

        <View style={styles.actions}>
          <Button
            title="Commencer"
            onPress={handleStart}
            disabled={!selectedDifficulty || loading}
            loading={loading}
            style={styles.startButton}
          />
          <Button
            title="Retour"
            onPress={() => router.back()}
            variant="ghost"
            style={styles.backButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
