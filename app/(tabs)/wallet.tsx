import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useColors } from "@/hooks/useColors";
import { useEconomy } from "@/hooks/useEconomy";
import { useQuery } from "convex/react";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WalletScreen() {
  const colors = useColors();
  const { isSignedIn, userId } = useAuth();
  const { balance, currency, transactions, redeemCode } = useEconomy();
  const [rechargeModalVisible, setRechargeModalVisible] = useState(false);
  const [rechargeCode, setRechargeCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  
  const codeInfoQuery = useQuery(
    api.recharge.getRechargeCode,
    rechargeCode.trim().length >= 3 ? { code: rechargeCode.trim() } : "skip"
  );

  const codeInfo = codeInfoQuery ? {
    amount: codeInfoQuery.amount,
    currency: codeInfoQuery.currency,
    isValid: codeInfoQuery.isValid,
  } : null;

  const handleRedeemCode = async () => {
    if (!codeInfo || !rechargeCode.trim()) return;

    setRedeeming(true);
    try {
      await redeemCode(rechargeCode.trim());
      Alert.alert(
        "Recharge réussie",
        `Votre compte a été crédité de ${codeInfo.amount.toLocaleString()} ${codeInfo.currency}`
      );
      setRechargeModalVisible(false);
      setRechargeCode("");
    } catch (error: any) {
      Alert.alert("Erreur", error.message || "Impossible d'utiliser ce code");
    } finally {
      setRedeeming(false);
    }
  };

  const handleCloseModal = () => {
    setRechargeModalVisible(false);
    setRechargeCode("");
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
      paddingBottom: 100,
    },
    balanceCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 24,
      alignItems: "center",
      marginBottom: 24,
      borderWidth: 2,
      borderColor: colors.secondary,
    },
    balanceLabel: {
      fontSize: 16,
      color: colors.mutedForeground,
      marginBottom: 8,
    },
    balanceAmount: {
      fontSize: 48,
      fontWeight: "700",
      color: colors.secondary,
      marginBottom: 12,
    },
    badge: {
      marginTop: 8,
    },
    statsContainer: {
      flexDirection: "row",
      gap: 16,
      marginBottom: 24,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      alignItems: "center",
    },
    statLabel: {
      fontSize: 14,
      color: colors.mutedForeground,
      marginBottom: 8,
    },
    statValue: {
      fontSize: 24,
      fontWeight: "600",
      color: colors.text,
    },
    section: {
      marginTop: 8,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 16,
    },
    emptyState: {
      padding: 32,
      alignItems: "center",
    },
    emptyText: {
      color: colors.mutedForeground,
      fontSize: 14,
    },
    transactionsList: {
      gap: 12,
    },
    transactionItem: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    transactionWin: {
      borderLeftWidth: 4,
      borderLeftColor: colors.secondary,
    },
    transactionLoss: {
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    transactionContent: {
      flex: 1,
    },
    transactionDescription: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 4,
    },
    transactionDate: {
      fontSize: 12,
      color: colors.mutedForeground,
    },
    transactionAmount: {
      fontSize: 16,
      fontWeight: "700",
    },
    amountWin: {
      color: colors.secondary,
    },
    amountLoss: {
      color: colors.primary,
    },
    text: {
      color: colors.text,
    },
    rechargeButton: {
      marginTop: 16,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 24,
      width: "100%",
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
    codeInput: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: colors.text,
      marginBottom: 16,
      textTransform: "uppercase",
      letterSpacing: 2,
    },
    codeInfo: {
      backgroundColor: colors.muted,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    codeInfoText: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 4,
    },
    codeInfoAmount: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.secondary,
    },
    modalActions: {
      gap: 12,
    },
  });

  if (!isSignedIn) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <Text style={styles.text}>Veuillez vous connecter</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Solde</Text>
            <Text style={styles.balanceAmount}>{balance.toLocaleString()}</Text>
            <Badge label={currency} variant="default" style={styles.badge} />
            <Button
              title="Recharger"
              onPress={() => setRechargeModalVisible(true)}
              variant="primary"
              style={styles.rechargeButton}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Historique des transactions</Text>
            {!transactions || transactions.length === 0 ?
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  Aucune transaction pour le moment
                </Text>
              </View>
            : <View style={styles.transactionsList}>
                {transactions.map((tx) => (
                  <View
                    key={tx._id}
                    style={[
                      styles.transactionItem,
                      tx.amount > 0 && styles.transactionWin,
                      tx.amount < 0 && styles.transactionLoss,
                    ]}
                  >
                    <View style={styles.transactionContent}>
                      <Text style={styles.transactionDescription}>
                        {tx.description}
                      </Text>
                      <Text style={styles.transactionDate}>
                        {new Date(tx.createdAt).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.transactionAmount,
                        tx.amount > 0 && styles.amountWin,
                        tx.amount < 0 && styles.amountLoss,
                      ]}
                    >
                      {tx.amount > 0 ? "+" : ""}
                      {tx.amount.toLocaleString()} {currency}
                    </Text>
                  </View>
                ))}
              </View>
            }
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={rechargeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Recharger mon compte</Text>
            <Text style={styles.modalSubtitle}>
              Entrez votre code de recharge
            </Text>

            <TextInput
              style={styles.codeInput}
              value={rechargeCode}
              onChangeText={(text) => {
                setRechargeCode(text.toUpperCase().replace(/[^A-Z0-9]/g, ""));
              }}
              placeholder="ABC123XYZ"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="characters"
              maxLength={20}
              editable={!redeeming}
            />

            {codeInfoQuery === null && rechargeCode.trim().length >= 3 && (
              <Text style={[styles.modalSubtitle, { color: colors.primary, marginTop: -16, marginBottom: 16 }]}>
                Code invalide ou introuvable
              </Text>
            )}

            {codeInfoQuery && !codeInfoQuery.isValid && (
              <Text style={[styles.modalSubtitle, { color: colors.primary, marginTop: -16, marginBottom: 16 }]}>
                {codeInfoQuery.isUsed ? "Ce code a déjà été utilisé" : codeInfoQuery.isExpired ? "Ce code a expiré" : "Ce code n'est plus actif"}
              </Text>
            )}

            {codeInfo && codeInfo.isValid && (
              <View style={styles.codeInfo}>
                <Text style={styles.codeInfoText}>Montant à recharger :</Text>
                <Text style={styles.codeInfoAmount}>
                  {codeInfo.amount.toLocaleString()} {codeInfo.currency}
                </Text>
              </View>
            )}

            <View style={styles.modalActions}>
              {codeInfo && codeInfo.isValid ? (
                <>
                  <Button
                    title={`Recharger ${codeInfo.amount.toLocaleString()} ${codeInfo.currency}`}
                    onPress={handleRedeemCode}
                    variant="primary"
                    loading={redeeming}
                    disabled={redeeming}
                  />
                  <Button
                    title="Annuler"
                    onPress={handleCloseModal}
                    variant="ghost"
                    disabled={redeeming}
                  />
                </>
              ) : (
                <Button
                  title="Annuler"
                  onPress={handleCloseModal}
                  variant="ghost"
                  disabled={redeeming}
                />
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
