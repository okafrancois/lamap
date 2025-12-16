import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGame } from '@/hooks/useGame';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { CardHand } from '@/components/game/CardHand';
import { PlayingCard } from '@/components/game/PlayingCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/theme';
import { type Card } from '@/convex/game';
import { SUIT_SYMBOLS } from '@/convex/game';

export default function MatchScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const router = useRouter();
  const gameMatchId = matchId as Id<"matches">;
  
  const { match, myHand, currentPlays, turnResults, isMyTurn, playCard, canPlayCard } = useGame(gameMatchId);
  const startMatch = useMutation(api.matches.startMatch);
  
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (match?.status === 'finished') {
      router.replace(`/(game)/result/${matchId}`);
    }
  }, [match?.status, matchId, router]);

  useEffect(() => {
    if (match?.status === 'ready' && !match.currentTurn) {
      startMatch({ matchId: gameMatchId }).catch((error) => {
        Alert.alert('Erreur', 'Impossible de démarrer le match');
        console.error(error);
      });
    }
  }, [match?.status, gameMatchId, startMatch]);

  const handleCardSelect = (card: Card) => {
    if (canPlayCard(card)) {
      setSelectedCard(card);
    }
  };

  const handlePlayCard = async () => {
    if (!selectedCard) return;
    
    setIsPlaying(true);
    try {
      await playCard(selectedCard);
      setSelectedCard(null);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de jouer cette carte');
    } finally {
      setIsPlaying(false);
    }
  };

  if (!match) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ActivityIndicator size="large" color={Colors.primary.gold} />
        <Text style={styles.loadingText}>Chargement du match...</Text>
      </SafeAreaView>
    );
  }

  if (match.status === 'waiting' || match.status === 'ready') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Text style={styles.title}>Préparation du match...</Text>
        <ActivityIndicator size="large" color={Colors.primary.gold} />
      </SafeAreaView>
    );
  }

  if (match.status === 'finished') {
    return null;
  }

  const player1Card = currentPlays.find((p) => p.playerId === match.player1Id);
  const player2Card = currentPlays.find((p) => p.playerId !== match.player1Id);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.turnIndicator}>
          <Text style={styles.turnText}>Tour {match.currentTurn} / 5</Text>
          {match.leadSuit && (
            <Badge 
              label={`Couleur demandée: ${SUIT_SYMBOLS[match.leadSuit as keyof typeof SUIT_SYMBOLS]}`} 
              variant="default" 
            />
          )}
        </View>
        <View style={styles.betInfo}>
          <Text style={styles.betText}>Mise: {match.betAmount} Kora</Text>
        </View>
      </View>

      <View style={styles.playArea}>
        <View style={styles.opponentArea}>
          <Text style={styles.playerLabel}>
            {match.isVsAI ? 'IA' : 'Adversaire'}
          </Text>
          {player2Card && (
            <View style={styles.playedCard}>
              <PlayingCard
                suit={player2Card.card.suit as Card['suit']}
                value={player2Card.card.value}
                state="played"
                size="small"
              />
            </View>
          )}
        </View>

        <View style={styles.centerArea}>
          {turnResults.length > 0 && (
            <View style={styles.turnHistory}>
              <Text style={styles.historyTitle}>Résultats des tours</Text>
              {turnResults.map((result) => (
                <Text key={result.turn} style={styles.historyItem}>
                  Tour {result.turn}: Gagnant avec {result.winningCard.value}
                  {SUIT_SYMBOLS[result.winningCard.suit as keyof typeof SUIT_SYMBOLS]}
                </Text>
              ))}
            </View>
          )}
        </View>

        <View style={styles.myArea}>
          {player1Card && (
            <View style={styles.playedCard}>
              <PlayingCard
                suit={player1Card.card.suit as Card['suit']}
                value={player1Card.card.value}
                state="played"
                size="small"
              />
            </View>
          )}
          <Text style={styles.playerLabel}>Vous</Text>
        </View>
      </View>

      <View style={styles.handArea}>
        {isMyTurn && !player1Card && (
          <View style={styles.turnIndicator}>
            <Text style={styles.yourTurnText}>C'est votre tour !</Text>
          </View>
        )}
        {!isMyTurn && (
          <View style={styles.turnIndicator}>
            <Text style={styles.waitingText}>En attente de l'adversaire...</Text>
          </View>
        )}
        <CardHand
          cards={myHand}
          leadSuit={match.leadSuit || null}
          isMyTurn={isMyTurn && !player1Card}
          onCardSelect={handleCardSelect}
          selectedCard={selectedCard}
          disabled={isPlaying || !!player1Card}
        />
        {selectedCard && isMyTurn && !player1Card && (
          <View style={styles.playButtonContainer}>
            <Button
              title="Jouer cette carte"
              onPress={handlePlayCard}
              loading={isPlaying}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.derived.blueDark,
  },
  loadingText: {
    color: Colors.derived.white,
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    padding: 16,
    backgroundColor: Colors.primary.blue,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary.gold,
  },
  turnIndicator: {
    alignItems: 'center',
    marginBottom: 8,
  },
  turnText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.derived.white,
    marginBottom: 8,
  },
  betInfo: {
    alignItems: 'center',
  },
  betText: {
    fontSize: 16,
    color: Colors.primary.gold,
    fontWeight: '600',
  },
  playArea: {
    flex: 1,
    padding: 16,
  },
  opponentArea: {
    alignItems: 'center',
    marginBottom: 24,
  },
  centerArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  myArea: {
    alignItems: 'center',
    marginTop: 24,
  },
  playerLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.derived.white,
    marginBottom: 8,
  },
  playedCard: {
    marginVertical: 8,
  },
  turnHistory: {
    backgroundColor: Colors.primary.blue,
    borderRadius: 12,
    padding: 12,
    minWidth: 200,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.derived.white,
    marginBottom: 8,
  },
  historyItem: {
    fontSize: 12,
    color: Colors.derived.blueLight,
    marginBottom: 4,
  },
  handArea: {
    padding: 16,
    backgroundColor: Colors.primary.blue,
    borderTopWidth: 2,
    borderTopColor: Colors.primary.gold,
  },
  yourTurnText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary.gold,
    marginBottom: 8,
  },
  waitingText: {
    fontSize: 16,
    color: Colors.derived.blueLight,
    marginBottom: 8,
  },
  playButtonContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.derived.white,
    marginBottom: 16,
  },
});

