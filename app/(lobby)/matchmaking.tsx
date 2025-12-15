import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMatchmaking } from '@/hooks/useMatchmaking';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Colors } from '@/constants/theme';

export default function MatchmakingScreen() {
  const router = useRouter();
  const { betAmount } = useLocalSearchParams<{ betAmount: string }>();
  const { status, opponent, matchId, joinQueue, leaveQueue, timeInQueue } =
    useMatchmaking();
  const [pulseAnim] = useState(new Animated.Value(1));

  const bet = betAmount ? parseInt(betAmount, 10) : 0;

  useEffect(() => {
    if (bet > 0 && status === 'idle') {
      joinQueue(bet).catch((error) => {
        console.error('Error joining queue:', error);
      });
    }
  }, [bet, status, joinQueue]);

  useEffect(() => {
    if (status === 'searching') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [status, pulseAnim]);

  useEffect(() => {
    if (status === 'matched' && matchId) {
      router.replace(`/(lobby)/room/${matchId}`);
    }
  }, [status, matchId, router]);

  const handleCancel = async () => {
    await leaveQueue();
    router.back();
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {status === 'searching' && (
          <>
            <Animated.View
              style={[
                styles.searchIcon,
                {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <ActivityIndicator size="large" color={Colors.primary.gold} />
            </Animated.View>
            <Text style={styles.title}>Recherche d'adversaire...</Text>
            <Text style={styles.subtitle}>
              Mise: {bet} Kora
            </Text>
            <Text style={styles.timeText}>
              Temps écoulé: {formatTime(timeInQueue)}
            </Text>
            <Button
              title="Annuler"
              onPress={handleCancel}
              variant="secondary"
              style={styles.cancelButton}
            />
          </>
        )}

        {status === 'matched' && opponent && (
          <>
            <Text style={styles.foundTitle}>Adversaire trouvé !</Text>
            <Avatar
              name={opponent.username}
              size={80}
            />
            <Text style={styles.opponentName}>{opponent.username}</Text>
            <Text style={styles.subtitle}>
              Mise: {bet} Kora
            </Text>
          </>
        )}

        {status === 'idle' && (
          <>
            <ActivityIndicator size="large" color={Colors.primary.gold} />
            <Text style={styles.title}>Préparation...</Text>
          </>
        )}
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
    alignItems: 'center',
    padding: 24,
  },
  searchIcon: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.derived.white,
    textAlign: 'center',
    marginBottom: 16,
  },
  foundTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary.gold,
    textAlign: 'center',
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.derived.blueLight,
    textAlign: 'center',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 16,
    color: Colors.derived.blueLight,
    textAlign: 'center',
    marginBottom: 32,
  },
  opponentName: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.derived.white,
    marginTop: 16,
    marginBottom: 8,
  },
  cancelButton: {
    marginTop: 32,
    minWidth: 200,
  },
});

