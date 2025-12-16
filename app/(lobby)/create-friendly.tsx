import { Button } from "@/components/ui/Button";
import { Colors } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "convex/react";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Clipboard, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CreateFriendlyScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const createFriendlyMatch = useMutation(
    api.friendlyMatches.createFriendlyMatch
  );
  const [loading, setLoading] = useState(false);
  const [joinCode, setJoinCode] = useState<string | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!userId) {
      Alert.alert("Erreur", "Vous devez être connecté pour créer une partie");
      return;
    }

    setLoading(true);
    try {
      const user = await fetch(
        `https://api.convex.dev/api/query?function=users.getCurrentUser&args=${encodeURIComponent(JSON.stringify({ clerkUserId: userId }))}`
      ).then((r) => r.json());

      if (!user || !user._id) {
        throw new Error("User not found");
      }

      const result = await createFriendlyMatch({
        hostId: user._id as any,
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

  const handleCopyCode = () => {
    if (joinCode) {
      Clipboard.setString(joinCode);
      Alert.alert("Code copié", "Le code a été copié dans le presse-papiers");
    }
  };

  const handleGoToRoom = () => {
    if (gameId) {
      router.replace(`/(lobby)/room/${gameId}`);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.derived.blueDark,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.derived.white,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.derived.blueLight,
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
    color: Colors.derived.blueLight,
    marginBottom: 16,
  },
  codeContainer: {
    backgroundColor: Colors.primary.blue,
    borderRadius: 16,
    padding: 24,
    borderWidth: 3,
    borderColor: Colors.primary.gold,
    marginBottom: 24,
    minWidth: 200,
  },
  codeText: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.primary.gold,
    letterSpacing: 4,
    textAlign: "center",
  },
  copyButton: {
    minHeight: 56,
    marginBottom: 16,
  },
  instructions: {
    fontSize: 14,
    color: Colors.derived.blueLight,
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
