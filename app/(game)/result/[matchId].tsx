import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Colors } from '@/constants/theme';

export default function ResultScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const router = useRouter();
  const { userId } = useAuth();
  const myUserId = userId ? (userId as any as Id<"users">) : null;

  const match = useQuery(api.matches.get, {
    matchId: matchId as Id<"matches">,
  });

  if (!match) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Text style={styles.text}>Chargement...</Text>
      </SafeAreaView>
    );
  }

  const isWinner = match.winnerId === myUserId;
  const winTypeLabels: Record<string, string> = {
    normal: 'Victoire normale',
    kora: 'Kora simple',
    double_kora: 'Double Kora',
    triple_kora: 'Triple Kora',
    main_faible: 'Main faible',
    triple_7: 'Triple 7',
  };

  const winTypeLabel = winTypeLabels[match.winType || 'normal'] || 'Victoire';
  const totalBet = match.betAmount * 2;
  const platformFee = totalBet * 0.1;
  const winnings = (totalBet - platformFee) * match.koraMultiplier;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <View style={[styles.resultCard, isWinner ? styles.winnerCard : styles.loserCard]}>
          <Text style={styles.resultTitle}>
            {isWinner ? '🎉 Victoire !' : '😔 Défaite'}
          </Text>
          
          <View style={styles.winTypeContainer}>
            <Badge
              label={winTypeLabel}
              variant={isWinner ? 'kora' : 'default'}
              style={styles.winTypeBadge}
            />
            {match.koraMultiplier > 1 && (
              <Badge
                label={`x${match.koraMultiplier}`}
                variant="kora"
                style={styles.multiplierBadge}
              />
            )}
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Mise totale</Text>
              <Text style={styles.statValue}>{totalBet} Kora</Text>
            </View>
            {isWinner && (
              <>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Commission (10%)</Text>
                  <Text style={styles.statValue}>-{platformFee} Kora</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Multiplicateur</Text>
                  <Text style={styles.statValue}>x{match.koraMultiplier}</Text>
                </View>
                <View style={[styles.statRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Gains</Text>
                  <Text style={styles.totalValue}>{Math.round(winnings)} Kora</Text>
                </View>
              </>
            )}
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title="Rejouer"
            onPress={() => router.replace('/(tabs)')}
            variant="primary"
            style={styles.button}
          />
          <Button
            title="Retour à l'accueil"
            onPress={() => router.replace('/(tabs)')}
            variant="secondary"
            style={styles.button}
          />
        </View>
      </View>
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
    justifyContent: 'center',
    padding: 24,
  },
  resultCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    borderWidth: 3,
  },
  winnerCard: {
    backgroundColor: Colors.primary.blue,
    borderColor: Colors.primary.gold,
  },
  loserCard: {
    backgroundColor: Colors.primary.blue,
    borderColor: Colors.primary.red,
  },
  resultTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.derived.white,
    textAlign: 'center',
    marginBottom: 16,
  },
  winTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  winTypeBadge: {
    marginHorizontal: 4,
  },
  multiplierBadge: {
    marginHorizontal: 4,
  },
  statsContainer: {
    gap: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.derived.blueLight,
  },
  totalRow: {
    borderTopWidth: 2,
    borderTopColor: Colors.primary.gold,
    borderBottomWidth: 0,
    marginTop: 8,
    paddingTop: 16,
  },
  statLabel: {
    fontSize: 16,
    color: Colors.derived.blueLight,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.derived.white,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary.gold,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary.gold,
  },
  actions: {
    gap: 12,
  },
  button: {
    minHeight: 56,
  },
  text: {
    color: Colors.derived.white,
  },
});

