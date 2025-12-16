import { Button } from "@/components/ui/Button";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useColors } from "@/hooks/useColors";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function JoinFriendlyScreen() {
  const colors = useColors();
  const router = useRouter();
  const { userId } = useAuth();
  const user = useQuery(
    api.users.getCurrentUser,
    userId ? { clerkUserId: userId } : "skip"
  );
  const joinFriendlyMatch = useMutation(api.friendlyMatches.joinFriendlyMatch);
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);

  const matchInfo = useQuery(
    api.friendlyMatches.getFriendlyMatchByCode,
    joinCode.length === 6 ? { joinCode: joinCode.toUpperCase() } : "skip"
  );

  const handleJoin = async () => {
    if (!userId || !user?._id) {
      Alert.alert(
        "Erreur",
        "Vous devez être connecté pour rejoindre une partie"
      );
      return;
    }

    if (joinCode.length !== 6) {
      Alert.alert("Erreur", "Le code doit contenir 6 caractères");
      return;
    }

    setLoading(true);
    try {
      const result = await joinFriendlyMatch({
        playerId: user._id,
        joinCode: joinCode.toUpperCase(),
      });

      if (result.success && result.gameId) {
        router.replace(`/(lobby)/room/${result.gameId}`);
      }
    } catch (error: any) {
      Alert.alert(
        "Erreur",
        error.message || "Impossible de rejoindre la partie. Vérifiez le code."
      );
      console.error("Error joining friendly match:", error);
    } finally {
      setLoading(false);
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
    inputSection: {
      marginBottom: 32,
    },
    inputLabel: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 12,
      fontWeight: "600",
    },
    input: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      fontSize: 24,
      fontWeight: "700",
      color: colors.secondary,
      textAlign: "center",
      letterSpacing: 4,
      borderWidth: 2,
      borderColor: colors.secondary,
      marginBottom: 16,
    },
    matchInfo: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginTop: 8,
    },
    matchInfoText: {
      fontSize: 14,
      color: colors.mutedForeground,
      marginBottom: 4,
    },
    joinButton: {
      minHeight: 56,
      marginBottom: 16,
    },
    backButton: {
      marginTop: 8,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.content}>
        <Text style={styles.title}>Rejoindre une partie amicale</Text>
        <Text style={styles.subtitle}>
          Entrez le code de la partie partagé par votre ami
        </Text>

        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Code de la partie</Text>
          <TextInput
            style={styles.input}
            value={joinCode}
            onChangeText={(text) =>
              setJoinCode(
                text
                  .toUpperCase()
                  .replace(/[^A-Z0-9]/g, "")
                  .slice(0, 6)
              )
            }
            placeholder="ABC123"
            placeholderTextColor={colors.mutedForeground}
            maxLength={6}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          {matchInfo && (
            <View style={styles.matchInfo}>
              <Text style={styles.matchInfoText}>
                Partie: {matchInfo.roomName || "Partie amicale"}
              </Text>
              <Text style={styles.matchInfoText}>
                Joueurs: {matchInfo.players.length}/{matchInfo.maxPlayers}
              </Text>
            </View>
          )}
        </View>

        <Button
          title="Rejoindre"
          onPress={handleJoin}
          loading={loading}
          disabled={joinCode.length !== 6 || loading}
          style={styles.joinButton}
        />

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
