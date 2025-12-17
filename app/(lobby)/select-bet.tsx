import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useColors } from "@/hooks/useColors";
import { useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BET_AMOUNTS = [100, 500, 1000, 5000];

export default function SelectBetScreen() {
  const colors = useColors();
  const router = useRouter();
  const { vsAI } = useLocalSearchParams<{ vsAI?: string }>();
  const { userId } = useAuth();
  const user = useQuery(
    api.users.getCurrentUser,
    userId ? { clerkUserId: userId } : "skip"
  );
  const [selectedBet, setSelectedBet] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [customAmount, setCustomAmount] = useState("");

  const handleContinue = async () => {
    if (!selectedBet) return;
    if (!user || (user.balance || 0) < selectedBet) {
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

  const handleCustomBet = () => {
    const amount = parseInt(customAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Erreur", "Veuillez entrer un montant valide");
      return;
    }
    if (!user || (user.balance || 0) < amount) {
      Alert.alert(
        "Solde insuffisant",
        `Votre solde est de ${user?.balance || 0} ${user?.currency || "XAF"}. Vous ne pouvez pas miser ${amount} ${user?.currency || "XAF"}.`
      );
      return;
    }
    setSelectedBet(amount);
    setCustomModalVisible(false);
    setCustomAmount("");
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      padding: 24,
      justifyContent: "center",
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
      gap: 16,
      marginBottom: 16,
    },
    betButton: {
      minHeight: 64,
    },
    selectedBet: {
      borderWidth: 3,
      borderColor: colors.secondary,
    },
    customButton: {
      minHeight: 64,
      backgroundColor: colors.accent,
      borderWidth: 2,
      borderColor: colors.border,
      borderStyle: "dashed",
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
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 24,
      width: "80%",
      maxWidth: 400,
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 8,
    },
    modalSubtitle: {
      fontSize: 14,
      color: colors.mutedForeground,
      marginBottom: 24,
    },
    input: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 16,
      fontSize: 18,
      color: colors.text,
      marginBottom: 24,
    },
    modalActions: {
      flexDirection: "row",
      gap: 12,
    },
    modalButton: {
      flex: 1,
      minHeight: 48,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Choisir la mise</Text>
        <Text style={styles.subtitle}>
          Votre solde: {user?.balance?.toLocaleString() || 0}{" "}
          {user?.currency || "XAF"}
        </Text>

        <View style={styles.betOptions}>
          {BET_AMOUNTS.map((amount) => {
            const canAfford = user ? (user.balance || 0) >= amount : false;
            return (
              <Button
                key={amount}
                title={`${amount} ${user?.currency || "XAF"}`}
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
          <Button
            title="Montant personnalisé"
            onPress={() => setCustomModalVisible(true)}
            variant="outline"
            style={styles.customButton}
          />
        </View>

        {selectedBet && (
          <View style={styles.selectedInfo}>
            <Badge
              label={`Mise sélectionnée: ${selectedBet} ${user?.currency || "XAF"}`}
              variant="default"
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

      <Modal
        visible={customModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCustomModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCustomModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Montant personnalisé</Text>
              <Text style={styles.modalSubtitle}>
                Solde disponible: {user?.balance?.toLocaleString() || 0}{" "}
                {user?.currency || "XAF"}
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Entrez le montant"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                value={customAmount}
                onChangeText={setCustomAmount}
                autoFocus
              />
              <View style={styles.modalActions}>
                <Button
                  title="Annuler"
                  onPress={() => {
                    setCustomModalVisible(false);
                    setCustomAmount("");
                  }}
                  variant="ghost"
                  style={styles.modalButton}
                />
                <Button
                  title="Valider"
                  onPress={handleCustomBet}
                  style={styles.modalButton}
                />
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
