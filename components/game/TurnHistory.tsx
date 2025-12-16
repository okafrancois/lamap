import { Colors } from '@/constants/theme';
import { type TurnResult } from '@/convex/game';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PlayingCard } from './PlayingCard';

interface TurnHistoryProps {
  results: TurnResult[];
  myPlayerId: string | null | undefined;
}

export function TurnHistory({ results, myPlayerId }: TurnHistoryProps) {
  if (results.length === 0 || !myPlayerId) return null;

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {results.map((result) => {
          // Skip if we don't have full history details (legacy data compatibility)
          if (!result.losingCard || !result.loserId) return null;

          const isWin = result.winnerId === myPlayerId;
          const myCard = isWin ? result.winningCard : result.losingCard;
          const opCard = isWin ? result.losingCard : result.winningCard;

          if (!myCard || !opCard) return null;

          return (
            <View key={result.turn} style={styles.column}>
              <View style={styles.cardContainer}>
                <PlayingCard
                  suit={opCard.suit}
                  value={opCard.value}
                  state="played"
                  size="small"
                />
              </View>

              <View style={styles.badge}>
                <Text style={styles.badgeText}>{result.turn}</Text>
              </View>

              <View style={styles.cardContainer}>
                <PlayingCard
                  suit={myCard.suit}
                  value={myCard.value}
                  state="played"
                  size="small"
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  column: {
    alignItems: 'center',
    position: 'relative',
    gap: 8,
  },
  cardContainer: {
    opacity: 0.9, // Slight fade for history
  },
  badge: {
    backgroundColor: Colors.primary.gold,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: '50%',
    marginTop: -12,
    zIndex: 10,
    borderWidth: 2,
    borderColor: Colors.derived.blueDark,
  },
  badgeText: {
    color: Colors.derived.blueDark,
    fontSize: 12,
    fontWeight: '700',
  },
});
