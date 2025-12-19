import { Button } from "@/components/ui/Button";
import { api } from "@/convex/_generated/api";
import { Currency } from "@/convex/currencies";
import { useAuth } from "@/hooks/useAuth";
import { useColors } from "@/hooks/useColors";
import { useMutation } from "convex/react";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

interface ChallengeModalProps {
  visible: boolean;
  onClose: () => void;
  challengedUserId: string;
  challengedUsername: string;
  currency: Currency;
}

export function ChallengeModal({
  visible,
  onClose,
  challengedUserId,
  challengedUsername,
  currency,
}: ChallengeModalProps) {
  const colors = useColors();
  const { convexUser } = useAuth();
  const [mode, setMode] = useState<"RANKED" | "CASH">("RANKED");
  const [betAmount, setBetAmount] = useState("");
  const [isCompetitive, setIsCompetitive] = useState(true);
  const [loading, setLoading] = useState(false);

  const sendChallenge = useMutation(api.challenges.sendChallenge);

  const handleSendChallenge = async () => {
    if (!convexUser?._id) {
      Alert.alert("Erreur", "Vous devez être connecté pour défier un joueur.");
      return;
    }

    if (mode === "CASH" && (!betAmount || parseFloat(betAmount) <= 0)) {
      Alert.alert("Erreur", "Veuillez entrer un montant de mise valide.");
      return;
    }

    setLoading(true);
    try {
      await sendChallenge({
        challengerId: convexUser._id,
        challengedId: challengedUserId as any,
        mode,
        betAmount: mode === "CASH" ? parseFloat(betAmount) : undefined,
        currency: mode === "CASH" ? currency : undefined,
        competitive: mode === "CASH" ? isCompetitive : undefined,
      });

      Alert.alert("Défi envoyé", `Votre défi a été envoyé à ${challengedUsername}.`);
      onClose();
      setMode("RANKED");
      setBetAmount("");
      setIsCompetitive(true);
    } catch (error: any) {
      Alert.alert("Erreur", error.message || "Impossible d'envoyer le défi.");
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 24,
      width: "90%",
      maxWidth: 500,
      maxHeight: "80%",
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
    modeSelector: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 24,
    },
    modeButton: {
      flex: 1,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 12,
    },
    input: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: colors.text,
    },
    competitiveToggle: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    toggleLabel: {
      flex: 1,
      marginRight: 12,
    },
    toggleTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 4,
    },
    toggleDescription: {
      fontSize: 13,
      color: colors.mutedForeground,
    },
    actions: {
      flexDirection: "row",
      gap: 12,
      marginTop: 8,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>Défier {challengedUsername}</Text>
            <Text style={styles.modalSubtitle}>
              Choisissez le type de partie que vous souhaitez jouer
            </Text>

            <View style={styles.modeSelector}>
              <Button
                title="Classé"
                onPress={() => setMode("RANKED")}
                variant={mode === "RANKED" ? "primary" : "outline"}
                style={styles.modeButton}
              />
              <Button
                title="Cash"
                onPress={() => setMode("CASH")}
                variant={mode === "CASH" ? "primary" : "outline"}
                style={styles.modeButton}
              />
            </View>

            {mode === "RANKED" && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Partie Classée</Text>
                <Text style={{ color: colors.mutedForeground, marginBottom: 12 }}>
                  • Gratuite (0 mise){"\n"}
                  • Affecte votre classement PR{"\n"}
                  • Matchmaking par rang
                </Text>
              </View>
            )}

            {mode === "CASH" && (
              <>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Montant de la mise</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={`Entrez le montant en ${currency}`}
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="numeric"
                    value={betAmount}
                    onChangeText={setBetAmount}
                  />
                </View>

                <View style={styles.section}>
                  <View style={styles.competitiveToggle}>
                    <View style={styles.toggleLabel}>
                      <Text style={styles.toggleTitle}>Mode Compétitif</Text>
                      <Text style={styles.toggleDescription}>
                        {isCompetitive ?
                          "✓ Affecte votre classement PR\n✓ Matchmaking par rang\n✓ Gains d'argent réel"
                        : "• N'affecte pas votre PR\n• Matchmaking libre\n• Gains d'argent réel uniquement"}
                      </Text>
                    </View>
                    <Switch
                      value={isCompetitive}
                      onValueChange={setIsCompetitive}
                      trackColor={{ false: colors.muted, true: colors.secondary }}
                      thumbColor={colors.card}
                    />
                  </View>
                </View>
              </>
            )}

            <View style={styles.actions}>
              <Button
                title="Envoyer le défi"
                onPress={handleSendChallenge}
                variant="primary"
                loading={loading}
                style={{ flex: 1 }}
              />
              <Button
                title="Annuler"
                onPress={onClose}
                variant="ghost"
                style={{ flex: 1 }}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

