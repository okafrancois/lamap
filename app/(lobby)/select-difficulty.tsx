import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMatchmaking } from '@/hooks/useMatchmaking';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/theme';

const DIFFICULTIES = [
  { value: 'easy', label: 'Facile' },
  { value: 'medium', label: 'Moyen' },
  { value: 'hard', label: 'Difficile' },
];

export default function SelectDifficultyScreen() {
  const router = useRouter();
  const { betAmount } = useLocalSearchParams<{ betAmount: string }>();
  const { createMatchVsAI } = useMatchmaking();
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    if (!selectedDifficulty || !betAmount) return;

    setLoading(true);
    try {
      const matchId = await createMatchVsAI(parseInt(betAmount, 10), selectedDifficulty);
      router.replace(`/(game)/match/${matchId}`);
    } catch (error) {
      console.error('Error creating match vs AI:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Choisir la difficulté</Text>
        <Text style={styles.subtitle}>
          Mise: {betAmount} Kora
        </Text>

        <View style={styles.options}>
          {DIFFICULTIES.map((difficulty) => (
            <Button
              key={difficulty.value}
              title={difficulty.label}
              onPress={() => setSelectedDifficulty(difficulty.value)}
              variant={selectedDifficulty === difficulty.value ? 'primary' : 'secondary'}
              style={[
                styles.difficultyButton,
                selectedDifficulty === difficulty.value && styles.selectedDifficulty,
              ]}
            />
          ))}
        </View>

        <View style={styles.actions}>
          <Button
            title="Commencer"
            onPress={handleStart}
            disabled={!selectedDifficulty || loading}
            loading={loading}
            style={styles.startButton}
          />
          <Button
            title="Retour"
            onPress={() => router.back()}
            variant="ghost"
            style={styles.backButton}
          />
        </View>
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
  title: {
    fontSize: 32,
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
  options: {
    gap: 16,
    marginBottom: 32,
  },
  difficultyButton: {
    minHeight: 64,
  },
  selectedDifficulty: {
    borderWidth: 3,
    borderColor: Colors.primary.gold,
  },
  actions: {
    gap: 12,
  },
  startButton: {
    minHeight: 56,
  },
  backButton: {
    marginTop: 8,
  },
});

