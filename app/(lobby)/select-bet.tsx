import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { api } from "@/convex/_generated/api";
import { BET_AMOUNTS, Currency, getMinimumBalance } from "@/convex/currencies";
import { useAuth } from "@/hooks/useAuth";
import { useColors } from "@/hooks/useColors";
import { useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SelectBetScreen() {
  const colors = useColors();
  const router = useRouter();
  const { vsAI, mode } = useLocalSearchParams<{
    vsAI?: string;
    mode?: string;
  }>();
  const { userId } = useAuth();
  const user = useQuery(
    api.users.getCurrentUser,
    userId ? { clerkUserId: userId } : "skip"
  );
  const [selectedBet, setSelectedBet] = useState<number | null>(null);
  const [isCompetitive, setIsCompetitive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [customAmount, setCustomAmount] = useState("");

  const isCashMode = mode === "cash";
  const currency = (user?.currency as Currency) || "XAF";
  const availableBets = BET_AMOUNTS[currency];

  const handleContinue = async () => {
    if (!selectedBet) return;

    const userBalance = user?.balance || 0;
    const minimumRequired = getMinimumBalance(selectedBet);

    if (isCashMode && userBalance < minimumRequired) {
      Alert.alert(
        "Solde insuffisant",
        `Pour jouer avec une mise de ${selectedBet} ${currency}, vous devez avoir au moins ${minimumRequired} ${currency} (3× la mise pour couvrir un 333 Export).\n\nVotre solde: ${userBalance} ${currency}`
      );
      return;
    }

    if (userBalance < selectedBet) {
      Alert.alert(
        "Solde insuffisant",
        `Votre solde est de ${userBalance} ${currency}. Vous ne pouvez pas miser ${selectedBet} ${currency}.`
      );
      return;
    }

    setLoading(true);
    try {
      if (vsAI === "true") {
        router.push(`/(lobby)/select-difficulty?betAmount=${selectedBet}`);
      } else if (isCashMode) {
        router.push(
          `/(lobby)/matchmaking?betAmount=${selectedBet}&competitive=${isCompetitive}`
        );
      } else {
        router.push(`/(lobby)/matchmaking?betAmount=${selectedBet}`);
      }
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
    betOptions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      marginBottom: 16,
    },
    betButton: {
      minHeight: 56,
      flex: 1,
      minWidth: "47%",
    },
    selectedBet: {
      borderWidth: 3,
      borderColor: colors.secondary,
    },
    customInputContainer: {
      marginBottom: 24,
    },
    customInputLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 8,
    },
    customInput: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: colors.text,
    },
    selectedInfo: {
      alignItems: "center",
      marginBottom: 32,
    },
    actions: {
      gap: 12,
      marginTop: 16,
    },
    continueButton: {
      minHeight: 56,
    },
    backButton: {
      marginTop: 8,
    },
    competitiveToggle: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    toggleHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    toggleTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },
    toggleDescription: {
      fontSize: 13,
      color: colors.mutedForeground,
      lineHeight: 18,
    },
    warningCard: {
      backgroundColor: colors.destructive + "20",
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.destructive,
    },
    warningText: {
      fontSize: 14,
      color: colors.destructive,
      fontWeight: "600",
      textAlign: "center",
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>
          {isCashMode ? "Mode Cash" : "Choisir la mise"}
        </Text>
        <Text style={styles.subtitle}>
          Votre solde: {user?.balance?.toLocaleString() || 0} {currency}
        </Text>

        {isCashMode && (
          <View style={styles.competitiveToggle}>
            <View style={styles.toggleHeader}>
              <Text style={styles.toggleTitle}>Mode Compétitif</Text>
              <Switch
                value={isCompetitive}
                onValueChange={setIsCompetitive}
                trackColor={{ false: colors.muted, true: colors.secondary }}
                thumbColor={colors.card}
              />
            </View>
            <Text style={styles.toggleDescription}>
              {isCompetitive ?
                "✓ Affecte votre classement PR\n✓ Matchmaking par rang\n✓ Gains d'argent réel"
              : "• N'affecte pas votre PR\n• Matchmaking libre\n• Gains d'argent réel uniquement"
              }
            </Text>
          </View>
        )}

        <View style={styles.betOptions}>
          {availableBets.map((amount) => {
            const minimumRequired =
              isCashMode ? getMinimumBalance(amount) : amount;
            const canAfford =
              user ? (user.balance || 0) >= minimumRequired : false;
            return (
              <Button
                key={amount}
                title={`${amount} ${currency}`}
                onPress={() => {
                  setSelectedBet(amount);
                  setCustomAmount("");
                }}
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

        <View style={styles.customInputContainer}>
          <Text style={styles.customInputLabel}>Montant personnalisé</Text>
          <TextInput
            style={styles.customInput}
            placeholder={`Entrez un montant en ${currency}`}
            placeholderTextColor={colors.mutedForeground}
            keyboardType="numeric"
            value={customAmount}
            onChangeText={(text) => {
              setCustomAmount(text);
              const amount = parseInt(text);
              if (!isNaN(amount) && amount > 0) {
                setSelectedBet(amount);
              } else if (text === "") {
                setSelectedBet(null);
              }
            }}
          />
        </View>

        {selectedBet && (
          <View style={styles.selectedInfo}>
            <Badge
              label={`Mise sélectionnée: ${selectedBet} ${currency}`}
              variant="default"
            />
          </View>
        )}

        {isCashMode && selectedBet && (
          <View style={styles.warningCard}>
            <Text style={styles.warningText}>
              Solde minimum requis: {getMinimumBalance(selectedBet)} {currency}{" "}
              (3× la mise)
            </Text>
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
