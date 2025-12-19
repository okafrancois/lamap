import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useColors } from "@/hooks/useColors";
import { useClerk } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const colors = useColors();
  const { userId, isSignedIn, clerkUser } = useAuth();
  const { signOut } = useClerk();
  const router = useRouter();
  const user = useQuery(
    api.users.getCurrentUser,
    userId ? { clerkUserId: userId } : "skip"
  );

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: 24,
    },
    header: {
      alignItems: "center",
      marginBottom: 32,
    },
    username: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.text,
      marginTop: 16,
    },
    email: {
      fontSize: 14,
      color: colors.mutedForeground,
      marginTop: 4,
    },
    statsSection: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 16,
    },
    statsGrid: {
      flexDirection: "row",
      gap: 12,
    },
    statItem: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      alignItems: "center",
    },
    statValue: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.secondary,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: colors.mutedForeground,
      textAlign: "center",
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 12,
    },
    rankCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    balanceSection: {
      marginBottom: 24,
    },
    balanceCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 24,
      alignItems: "center",
      borderWidth: 2,
      borderColor: colors.secondary,
    },
    balanceLabel: {
      fontSize: 16,
      color: colors.mutedForeground,
      marginBottom: 8,
    },
    balanceAmount: {
      fontSize: 36,
      fontWeight: "700",
      color: colors.secondary,
      marginBottom: 12,
    },
    badge: {
      marginTop: 8,
    },
    actionsSection: {
      marginTop: 24,
      gap: 12,
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
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Avatar
              name={user?.username || clerkUser?.username || "User"}
              imageUrl={clerkUser?.imageUrl}
              size={80}
            />
            <Text style={styles.username}>
              {user?.username || clerkUser?.username || "Utilisateur"}
            </Text>
            {user?.email && <Text style={styles.email}>{user.email}</Text>}
          </View>

          {/* Rank Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Classement</Text>
            <View style={styles.rankCard}>
              <RankProgress pr={user?.pr || INITIAL_PR} showDetails />
            </View>
          </View>

          <View style={styles.balanceSection}>
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Solde</Text>
              <Text style={styles.balanceAmount}>
                {user?.balance?.toLocaleString() || 0}
              </Text>
              <Badge
                label={user?.currency || "XAF"}
                variant="default"
                style={styles.badge}
              />
            </View>
          </View>

          <View style={styles.actionsSection}>
            <Button
              title="Déconnexion"
              onPress={handleSignOut}
              variant="secondary"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
