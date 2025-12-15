import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Badge } from '@/components/ui/Badge';
import { Colors } from '@/constants/theme';
import { Id } from '@/convex/_generated/dataModel';

export default function WalletScreen() {
  const { userId, isSignedIn } = useAuth();
  const myUserId = userId ? (userId as any as Id<"users">) : null;
  const user = useQuery(
    api.users.getCurrentUser,
    userId ? { clerkId: userId } : 'skip'
  );
  const transactions = useQuery(
    api.economy.getTransactionHistory,
    myUserId ? { userId: myUserId } : 'skip'
  );

  if (!isSignedIn) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Veuillez vous connecter</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Solde Kora</Text>
          <Text style={styles.balanceAmount}>
            {user?.koraBalance?.toLocaleString() || 0}
          </Text>
          <Badge label="Kora" variant="kora" style={styles.badge} />
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total gagné</Text>
            <Text style={styles.statValue}>
              {user?.totalKoraWon?.toLocaleString() || 0}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total perdu</Text>
            <Text style={styles.statValue}>
              {user?.totalKoraLost?.toLocaleString() || 0}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historique des transactions</Text>
          {!transactions || transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Aucune transaction pour le moment</Text>
            </View>
          ) : (
            <View style={styles.transactionsList}>
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
                      {new Date(tx.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
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
                    {tx.amount > 0 ? '+' : ''}
                    {tx.amount.toLocaleString()} Kora
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.derived.blueDark,
  },
  content: {
    padding: 24,
  },
  balanceCard: {
    backgroundColor: Colors.primary.blue,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: Colors.primary.gold,
  },
  balanceLabel: {
    fontSize: 16,
    color: Colors.derived.blueLight,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.primary.gold,
    marginBottom: 12,
  },
  badge: {
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.primary.blue,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: Colors.derived.blueLight,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.derived.white,
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.derived.white,
    marginBottom: 16,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.derived.blueLight,
    fontSize: 14,
  },
  transactionsList: {
    gap: 12,
  },
  transactionItem: {
    backgroundColor: Colors.primary.blue,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionWin: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary.gold,
  },
  transactionLoss: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary.red,
  },
  transactionContent: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.derived.white,
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: Colors.derived.blueLight,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  amountWin: {
    color: Colors.primary.gold,
  },
  amountLoss: {
    color: Colors.primary.red,
  },
  text: {
    color: Colors.derived.white,
  },
});

