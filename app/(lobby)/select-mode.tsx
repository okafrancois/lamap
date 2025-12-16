import { Button } from "@/components/ui/Button";
import { useColors } from "@/hooks/useColors";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SelectModeScreen() {
  const colors = useColors();
  const router = useRouter();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      justifyContent: "center",
      padding: 24,
    },
    title: {
      fontSize: 32,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 18,
      color: colors.mutedForeground,
      textAlign: "center",
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

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.content}>
        <Text style={styles.title}>Choisir un mode</Text>
        <Text style={styles.subtitle}>Comment voulez-vous jouer ?</Text>

        <View style={styles.options}>
          <Button
            title="vs Joueur"
            onPress={() => router.push("/(lobby)/select-bet")}
            variant="primary"
            style={styles.button}
          />
          <Button
            title="vs IA"
            onPress={() => router.push("/(lobby)/select-difficulty")}
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
    </SafeAreaView>
  );
}
