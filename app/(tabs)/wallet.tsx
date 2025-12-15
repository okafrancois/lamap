import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Badge } from '@/components/ui/Badge';
import { Colors } from '@/constants/theme';

export default function WalletScreen() {
  const { userId, isSignedIn } = useAuth();
  const user = useQuery(
    api.users.getCurrentUser,
    userId ? { clerkId: userId } : 'skip'
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
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Aucune transaction pour le moment</Text>
          </View>
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
  text: {
    color: Colors.derived.white,
  },
});

