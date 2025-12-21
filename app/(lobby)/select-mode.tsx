import { RankBadge } from "@/components/ranking/RankBadge";
import { Button } from "@/components/ui/Button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { api } from "@/convex/_generated/api";
import { getRankFromPR, INITIAL_PR } from "@/convex/ranking";
import { useAuth } from "@/hooks/useAuth";
import { useColors } from "@/hooks/useColors";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SelectModeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { userId, convexUser } = useAuth();

  const activeGame = useQuery(
    api.games.getActiveMatch,
    userId ? { clerkId: userId } : "skip"
  );

  const userPR = convexUser?.pr || INITIAL_PR;
  const userRank = getRankFromPR(userPR);

  const styles = StyleSheet.create({
    activeMatchCard: {
      backgroundColor: colors.accent,
      borderRadius: 16,
      padding: 16,
      marginBottom: 20,
      borderWidth: 2,
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
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: 24,
      paddingTop: 40,
    },
    header: {
      marginBottom: 40,
    },
    title: {
      fontSize: 32,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.mutedForeground,
      textAlign: "center",
    },
    modesContainer: {
      gap: 16,
      marginBottom: 32,
    },
    modeCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modeHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    modeIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: colors.secondary,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 16,
    },
    modeInfo: {
      flex: 1,
    },
    modeTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 4,
    },
    modeDescription: {
      fontSize: 14,
      color: colors.mutedForeground,
    },
    modeFeatures: {
      fontSize: 13,
      lineHeight: 20,
      marginTop: 12,
      marginBottom: 4,
    },
    modeButton: {
      minHeight: 48,
      marginTop: 12,
    },
    friendlySection: {
      marginTop: 24,
      paddingTop: 24,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 16,
    },
    friendlyOptions: {
      gap: 12,
    },
    friendlyButton: {
      minHeight: 56,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
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

          <View style={styles.header}>
            <Text style={styles.title}>Choisir un mode</Text>
            <Text style={styles.subtitle}>Comment voulez-vous jouer ?</Text>
          </View>

          <View style={styles.modesContainer}>
            {/* Mode Cash */}
            <View style={styles.modeCard}>
              <View style={styles.modeHeader}>
                <View
                  style={[
                    styles.modeIconContainer,
                    { backgroundColor: "#7A9D54" },
                  ]}
                >
                  <Ionicons name="cash" size={28} color="#FFF" />
                </View>
                <View style={styles.modeInfo}>
                  <Text style={styles.modeTitle}>Mode Cash</Text>
                  <Text style={styles.modeDescription}>
                    Avec mise • Option compétitif
                  </Text>
                </View>
              </View>
              <Text
                style={[styles.modeFeatures, { color: colors.mutedForeground }]}
              >
                ✓ Mise d&apos;argent {"\n"}✓ Choix compétitif/non-compétitif
                {"\n"}✓ Gains
              </Text>
              <Button
                title="Jouer en Cash"
                onPress={() => router.push("/(lobby)/select-bet?mode=cash")}
                variant="primary"
                style={[styles.modeButton, { backgroundColor: "#7A9D54" }]}
              />
            </View>

            {/* Mode Classé */}
            <View
              style={[
                styles.modeCard,
                { borderColor: userRank.color, borderWidth: 2 },
              ]}
            >
              <View style={styles.modeHeader}>
                <View
                  style={[
                    styles.modeIconContainer,
                    { backgroundColor: userRank.color },
                  ]}
                >
                  <Ionicons name="trophy" size={28} color="#FFF" />
                </View>
                <View style={styles.modeInfo}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Text style={styles.modeTitle}>Mode Classé</Text>
                    <RankBadge rank={userRank} size="small" />
                  </View>
                  <Text style={styles.modeDescription}>
                    Gratuit • Affecte votre PR • {userPR} PR
                  </Text>
                </View>
              </View>
              <Text
                style={[styles.modeFeatures, { color: colors.mutedForeground }]}
              >
                ✓ Matchmaking par rang{"\n"}✓ Progression compétitive{"\n"}✓
                Sans mise &apos;argent&apos;
              </Text>
              <Button
                title="Jouer en Classé"
                onPress={() => router.push("/(lobby)/ranked-matchmaking")}
                variant="primary"
                style={styles.modeButton}
              />
            </View>

            {/* Mode IA */}
            <View style={styles.modeCard}>
              <View style={styles.modeHeader}>
                <View
                  style={[
                    styles.modeIconContainer,
                    { backgroundColor: colors.muted },
                  ]}
                >
                  <Ionicons name="hardware-chip" size={28} color="#FFF" />
                </View>
                <View style={styles.modeInfo}>
                  <Text style={styles.modeTitle}>Mode IA</Text>
                  <Text style={styles.modeDescription}>
                    Entraînement • Sans PR
                  </Text>
                </View>
              </View>
              <Text
                style={[styles.modeFeatures, { color: colors.mutedForeground }]}
              >
                ✓ Pratiquez sans risque{"\n"}✓ 3 niveaux de difficulté{"\n"}✓
                N&apos;affecte pas le PR
              </Text>
              <Button
                title="S'entraîner"
                onPress={() => router.push("/(lobby)/select-difficulty")}
                variant="secondary"
                style={styles.modeButton}
              />
            </View>
          </View>

          <Button
            title="Retour"
            onPress={() => router.back()}
            variant="ghost"
            icon={
              <IconSymbol name="arrow.left" size={24} color={colors.text} />
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
