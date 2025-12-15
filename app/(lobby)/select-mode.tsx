import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/theme';

export default function SelectModeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Choisir un mode</Text>
        <Text style={styles.subtitle}>Comment voulez-vous jouer ?</Text>

        <View style={styles.options}>
          <Button
            title="vs Joueur"
            onPress={() => router.push('/(lobby)/select-bet')}
            variant="primary"
            style={styles.button}
          />
          <Button
            title="vs IA"
            onPress={() => router.push('/(lobby)/select-bet?vsAI=true')}
            variant="secondary"
            style={styles.button}
          />
        </View>

        <Button
          title="Retour"
          onPress={() => router.back()}
          variant="ghost"
          style={styles.backButton}
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
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.derived.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.derived.blueLight,
    textAlign: 'center',
    marginBottom: 48,
  },
  options: {
    gap: 16,
    marginBottom: 32,
  },
  button: {
    minHeight: 64,
  },
  backButton: {
    marginTop: 16,
  },
});

