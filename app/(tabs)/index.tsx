import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Colors } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const router = useRouter();
  const { userId, isSignedIn } = useAuth();
  const user = useQuery(
    api.users.getCurrentUser,
    userId ? { clerkId: userId } : "skip"
  );

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

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Votre solde</Text>
          <Text style={styles.balanceAmount}>
            {user?.koraBalance?.toLocaleString() || 0}
          </Text>
          <Badge label="Kora" variant="kora" style={styles.badge} />
        </View>

        <View style={styles.actions}>
          <Button
            title="Jouer"
            onPress={() => router.push("/(lobby)/select-mode")}
            style={styles.playButton}
          />
        </View>

        <View style={styles.stats}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{user?.totalWins || 0}</Text>
            <Text style={styles.statLabel}>Victoires</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{user?.totalLosses || 0}</Text>
            <Text style={styles.statLabel}>Défaites</Text>
          </View>
        </View>
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
    color: Colors.derived.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.derived.blueLight,
  },
  balanceCard: {
    backgroundColor: Colors.primary.blue,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 32,
    borderWidth: 2,
    borderColor: Colors.primary.gold,
  },
  balanceLabel: {
    fontSize: 14,
    color: Colors.derived.blueLight,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: "700",
    color: Colors.primary.gold,
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
  },
  stats: {
    flexDirection: "row",
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.primary.blue,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.primary.gold,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.derived.blueLight,
  },
  text: {
    color: Colors.derived.white,
  },
});
