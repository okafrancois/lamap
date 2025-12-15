import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useAuth } from '@/hooks/useAuth';
import { useMatchmaking } from '@/hooks/useMatchmaking';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Colors } from '@/constants/theme';

export default function RoomScreen() {
  const router = useRouter();
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const { userId } = useAuth();
  const myUserId = userId ? (userId as any as Id<"users">) : null;
  const { setMatchReady } = useMatchmaking();
  const startMatch = useMutation(api.matches.startMatch);

  const match = useQuery(api.matches.get, {
    matchId: roomId as Id<"matches">,
  });

  const player1 = useQuery(
    api.users.getUserById,
    match?.player1Id ? { userId: match.player1Id } : 'skip'
  );
  const player2 = useQuery(
    api.users.getUserById,
    match?.player2Id ? { userId: match.player2Id } : 'skip'
  );

  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (match?.status === 'ready' || match?.status === 'playing') {
      router.replace(`/(game)/match/${roomId}`);
    }
  }, [match?.status, roomId, router]);

  const handleReady = async () => {
    if (!match) return;
    setLoading(true);
    try {
      await setMatchReady(match._id);
      setIsReady(true);

      if (match.status === 'ready') {
        await startMatch({ matchId: match._id });
      }
    } catch (error) {
      console.error('Error setting ready:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!match) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary.gold} />
        <Text style={styles.loadingText}>Chargement de la salle...</Text>
      </View>
    );
  }

  const isPlayer1 = match.player1Id === myUserId;
  const opponent = isPlayer1 ? player2 : player1;
  const me = isPlayer1 ? player1 : player2;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Salle d'attente</Text>
        <Text style={styles.subtitle}>Mise: {match.betAmount} Kora</Text>

        <View style={styles.players}>
          <View style={styles.playerCard}>
            <Avatar name={me?.username || 'Vous'} size={60} />
            <Text style={styles.playerName}>{me?.username || 'Vous'}</Text>
            {isReady && <Badge label="Prêt" variant="success" />}
          </View>

          <Text style={styles.vs}>VS</Text>

          <View style={styles.playerCard}>
            {opponent ? (
              <>
                <Avatar name={opponent.username} size={60} />
                <Text style={styles.playerName}>{opponent.username}</Text>
              </>
            ) : (
              <>
                <ActivityIndicator size="small" color={Colors.primary.gold} />
                <Text style={styles.waitingText}>En attente...</Text>
              </>
            )}
          </View>
        </View>

        {!isReady && (
          <View style={styles.readySection}>
            <Button
              title="Je suis prêt"
              onPress={handleReady}
              loading={loading}
              style={styles.readyButton}
            />
          </View>
        )}

        {isReady && (
          <View style={styles.readySection}>
            <Text style={styles.waitingText}>
              En attente de l'adversaire...
            </Text>
          </View>
        )}

        <Button
          title="Quitter"
          onPress={() => router.back()}
          variant="ghost"
          style={styles.leaveButton}
        />
      </View>
    </View>
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
  loadingText: {
    color: Colors.derived.white,
    marginTop: 16,
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.derived.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.primary.gold,
    textAlign: 'center',
    marginBottom: 48,
    fontWeight: '600',
  },
  players: {
    alignItems: 'center',
    marginBottom: 48,
  },
  playerCard: {
    alignItems: 'center',
    backgroundColor: Colors.primary.blue,
    borderRadius: 16,
    padding: 24,
    minWidth: 200,
    marginVertical: 16,
  },
  playerName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.derived.white,
    marginTop: 12,
  },
  vs: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary.gold,
    marginVertical: 16,
  },
  waitingText: {
    fontSize: 16,
    color: Colors.derived.blueLight,
    marginTop: 12,
    textAlign: 'center',
  },
  readySection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  readyButton: {
    minWidth: 200,
    minHeight: 56,
  },
  leaveButton: {
    marginTop: 16,
  },
});

