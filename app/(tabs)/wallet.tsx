import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/hooks/useAuth";
import { useColors } from "@/hooks/useColors";
import { useEconomy } from "@/hooks/useEconomy";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WalletScreen() {
  const colors = useColors();
  const { isSignedIn } = useAuth();
  const { balance, currency, transactions } = useEconomy();

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
  });

  if (!isSignedIn) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Text style={styles.text}>Veuillez vous connecter</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Solde</Text>
            <Text style={styles.balanceAmount}>{balance.toLocaleString()}</Text>
            <Badge label={currency} variant="kora" style={styles.badge} />
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
    </SafeAreaView>
  );
}
