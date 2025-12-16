import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useColors } from "@/hooks/useColors";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { userId, isSignedIn } = useAuth();
  const user = useQuery(
    api.users.getCurrentUser,
    userId ? { clerkUserId: userId } : "skip"
  );
  const activeGame = useQuery(
    api.games.getActiveMatch,
    userId ? { clerkId: userId } : "skip"
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      padding: 24,
      justifyContent: "center",
    },
    header: {
      alignItems: "center",
      marginBottom: 32,
    },
    title: {
      fontSize: 36,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.mutedForeground,
    },
    activeMatchCard: {
      backgroundColor: colors.accent,
      borderRadius: 16,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.secondary,
    },
    activeMatchContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
    },
    activeMatchLabel: {
      fontSize: 14,
      color: colors.secondary,
      fontWeight: "700",
      marginBottom: 4,
    },
    activeMatchInfo: {
      fontSize: 16,
      color: colors.text,
      fontWeight: "600",
    },
    rejoinButton: {
      minHeight: 40,
      paddingHorizontal: 16,
      backgroundColor: colors.secondary,
    },
    rejoinButtonText: {
      color: colors.secondaryForeground,
      fontSize: 14,
    },
    balanceCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 24,
      alignItems: "center",
      marginBottom: 32,
      borderWidth: 2,
      borderColor: colors.secondary,
    },
    balanceLabel: {
      fontSize: 14,
      color: colors.mutedForeground,
      marginBottom: 8,
    },
    balanceAmount: {
      fontSize: 48,
      fontWeight: "700",
      color: colors.secondary,
      marginBottom: 12,
    },
    badge: {
      marginTop: 4,
    },
    actions: {
      marginBottom: 32,
    },
    playButton: {
      minHeight: 56,
      marginBottom: 16,
    },
    friendlyActions: {
      gap: 12,
    },
    friendlyButton: {
      minHeight: 48,
    },
    stats: {
      flexDirection: "row",
      gap: 16,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 20,
      alignItems: "center",
    },
    statValue: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.secondary,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 14,
      color: colors.mutedForeground,
    },
    text: {
      color: colors.text,
    },
  });

  if (!isSignedIn) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Text style={styles.text}>Veuillez vous connecter</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>LaMap241</Text>
          <Text style={styles.subtitle}>Jeu de cartes compétitif</Text>
        </View>

        {activeGame && (
          <View style={styles.activeMatchCard}>
            <View style={styles.activeMatchContent}>
              <View>
                <Text style={styles.activeMatchLabel}>Partie en cours</Text>
                <Text style={styles.activeMatchInfo}>
                  {activeGame.mode === "AI" ?
                    "Contre l'IA"
                  : "Contre un joueur"}{" "}
                  • {activeGame.bet.amount} {activeGame.bet.currency}
                </Text>
              </View>
              <Button
                title="Rejoindre"
                onPress={() =>
                  router.push(`/(game)/match/${activeGame.gameId}`)
                }
                style={styles.rejoinButton}
                textStyle={styles.rejoinButtonText}
              />
            </View>
          </View>
        )}

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Votre solde</Text>
          <Text style={styles.balanceAmount}>
            {user?.balance?.toLocaleString() || 0}
          </Text>
          <Badge
            label={user?.currency || "XAF"}
            variant="kora"
            style={styles.badge}
          />
        </View>

        <View style={styles.actions}>
          <Button
            title="Jouer"
            onPress={() => router.push("/(lobby)/select-mode")}
            style={styles.playButton}
          />
          <View style={styles.friendlyActions}>
            <Button
              title="Créer une partie amicale"
              onPress={() => router.push("/(lobby)/create-friendly")}
              variant="secondary"
              style={styles.friendlyButton}
            />
            <Button
              title="Rejoindre une partie amicale"
              onPress={() => router.push("/(lobby)/join-friendly")}
              variant="secondary"
              style={styles.friendlyButton}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
