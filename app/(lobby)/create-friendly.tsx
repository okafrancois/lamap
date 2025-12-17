import { Button } from "@/components/ui/Button";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useColors } from "@/hooks/useColors";
import { useMutation, useQuery } from "convex/react";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CreateFriendlyScreen() {
  const colors = useColors();
  const router = useRouter();
  const { userId } = useAuth();
  const user = useQuery(
    api.users.getCurrentUser,
    userId ? { clerkUserId: userId } : "skip"
  );
  const createFriendlyMatch = useMutation(
    api.friendlyMatches.createFriendlyMatch
  );
  const [loading, setLoading] = useState(false);
  const [joinCode, setJoinCode] = useState<string | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!userId || !user?._id) {
      Alert.alert("Erreur", "Vous devez être connecté pour créer une partie");
      return;
    }

    setLoading(true);
    try {
      const result = await createFriendlyMatch({
        hostId: user._id,
        currency: "XAF",
      });

      setJoinCode(result.joinCode);
      setGameId(result.gameId);
    } catch (error: any) {
      Alert.alert(
        "Erreur",
        error.message || "Impossible de créer la partie. Réessayez."
      );
      console.error("Error creating friendly match:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (joinCode) {
      await Clipboard.setStringAsync(joinCode);
      Alert.alert("Code copié", "Le code a été copié dans le presse-papiers");
    }
  };

  const handleGoToRoom = () => {
    if (gameId) {
      router.replace(`/(lobby)/room/${gameId}`);
    }
  };

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
    createSection: {
      marginBottom: 32,
    },
    createButton: {
      minHeight: 64,
    },
    codeSection: {
      alignItems: "center",
      marginBottom: 32,
    },
    codeLabel: {
      fontSize: 18,
      color: colors.mutedForeground,
      marginBottom: 16,
    },
    codeContainer: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 24,
      borderWidth: 3,
      borderColor: colors.secondary,
      marginBottom: 24,
      minWidth: 200,
    },
    codeText: {
      fontSize: 32,
      fontWeight: "700",
      color: colors.secondary,
      letterSpacing: 4,
      textAlign: "center",
    },
    copyButton: {
      minHeight: 56,
      marginBottom: 16,
    },
    instructions: {
      fontSize: 14,
      color: colors.mutedForeground,
      textAlign: "center",
      marginBottom: 24,
    },
    roomButton: {
      minHeight: 56,
    },
    backButton: {
      marginTop: 16,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={styles.content}>
        <Text style={styles.title}>Créer une partie amicale</Text>
        <Text style={styles.subtitle}>
          Partagez le code avec votre ami pour qu&apos;il vous rejoigne
        </Text>

        {!joinCode ?
          <View style={styles.createSection}>
            <Button
              title="Créer la partie"
              onPress={handleCreate}
              loading={loading}
              disabled={loading}
              style={styles.createButton}
            />
          </View>
        : <View style={styles.codeSection}>
            <Text style={styles.codeLabel}>Code de la partie</Text>
            <View style={styles.codeContainer}>
              <Text style={styles.codeText}>{joinCode}</Text>
            </View>
            <Button
              title="Copier le code"
              onPress={handleCopyCode}
              variant="secondary"
              style={styles.copyButton}
            />
            <Text style={styles.instructions}>
              Partagez ce code avec votre ami pour qu&apos;il vous rejoigne
            </Text>
            <Button
              title="Aller à la salle"
              onPress={handleGoToRoom}
              variant="primary"
              style={styles.roomButton}
            />
          </View>
        }

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
