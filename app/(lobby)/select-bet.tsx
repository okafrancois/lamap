import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Colors } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BET_AMOUNTS = [10, 50, 100, 500];

export default function SelectBetScreen() {
  const router = useRouter();
  const { vsAI } = useLocalSearchParams<{ vsAI?: string }>();
  const { userId } = useAuth();
  const user = useQuery(
    api.users.getCurrentUser,
    userId ? { clerkId: userId } : "skip"
  );
  const [selectedBet, setSelectedBet] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!selectedBet) return;
    if (!user || user.koraBalance < selectedBet) {
      return;
    }

    setLoading(true);
    try {
      if (vsAI === "true") {
        router.push(`/(lobby)/select-difficulty?betAmount=${selectedBet}`);
      } else {
        router.push(`/(lobby)/matchmaking?betAmount=${selectedBet}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Choisir la mise</Text>
        <Text style={styles.subtitle}>
          Votre solde: {user?.koraBalance?.toLocaleString() || 0} Kora
        </Text>

        <View style={styles.betOptions}>
          {BET_AMOUNTS.map((amount) => {
            const canAfford = user ? user.koraBalance >= amount : false;
            return (
              <Button
                key={amount}
                title={`${amount} Kora`}
                onPress={() => setSelectedBet(amount)}
                variant={selectedBet === amount ? "primary" : "secondary"}
                disabled={!canAfford}
                style={
                  selectedBet === amount ?
                    [styles.betButton, styles.selectedBet]
                  : styles.betButton
                }
              />
            );
          })}
        </View>

        {selectedBet && (
          <View style={styles.selectedInfo}>
            <Badge
              label={`Mise sélectionnée: ${selectedBet} Kora`}
              variant="kora"
            />
          </View>
        )}

        <View style={styles.actions}>
          <Button
            title="Continuer"
            onPress={handleContinue}
            disabled={!selectedBet || loading}
            loading={loading}
            style={styles.continueButton}
          />
          <Button
            title="Retour"
            onPress={() => router.back()}
            variant="ghost"
            style={styles.backButton}
          />
        </View>
      </ScrollView>
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
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.derived.white,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.primary.gold,
    textAlign: "center",
    marginBottom: 48,
    fontWeight: "600",
  },
  betOptions: {
    gap: 16,
    marginBottom: 32,
  },
  betButton: {
    minHeight: 64,
  },
  selectedBet: {
    borderWidth: 3,
    borderColor: Colors.primary.gold,
  },
  selectedInfo: {
    alignItems: "center",
    marginBottom: 32,
  },
  actions: {
    gap: 12,
  },
  continueButton: {
    minHeight: 56,
  },
  backButton: {
    marginTop: 8,
  },
});
