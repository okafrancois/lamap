import { Button } from "@/components/ui/Button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/useColors";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SelectModeScreen() {
  const colors = useColors();
  const router = useRouter();

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
    backButton: {
      marginTop: 24,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Choisir un mode</Text>
            <Text style={styles.subtitle}>Comment voulez-vous jouer ?</Text>
          </View>

          <View style={styles.modesContainer}>
            <View style={styles.modeCard}>
              <View style={styles.modeHeader}>
                <View style={styles.modeIconContainer}>
                  <IconSymbol
                    name="person.fill"
                    size={24}
                    color={colors.secondaryForeground}
                  />
                </View>
                <View style={styles.modeInfo}>
                  <Text style={styles.modeTitle}>Contre un joueur</Text>
                  <Text style={styles.modeDescription}>
                    Affrontez un joueur en ligne
                  </Text>
                </View>
              </View>
              <Button
                title="Jouer en ligne"
                onPress={() => router.push("/(lobby)/select-bet")}
                variant="primary"
                style={styles.modeButton}
              />
            </View>

            <View style={styles.modeCard}>
              <View style={styles.modeHeader}>
                <View style={styles.modeIconContainer}>
                  <IconSymbol
                    name="gamecontroller.fill"
                    size={24}
                    color={colors.secondaryForeground}
                  />
                </View>
                <View style={styles.modeInfo}>
                  <Text style={styles.modeTitle}>Contre l&apos;IA</Text>
                  <Text style={styles.modeDescription}>
                    Entraînez-vous contre l&apos;ordinateur
                  </Text>
                </View>
              </View>
              <Button
                title="Jouer contre l'IA"
                onPress={() => router.push("/(lobby)/select-difficulty")}
                variant="secondary"
                style={styles.modeButton}
              />
            </View>
          </View>

          <View style={styles.friendlySection}>
            <Text style={styles.sectionTitle}>Parties amicales</Text>
            <View style={styles.friendlyOptions}>
              <Button
                title="Créer une partie amicale"
                onPress={() => router.push("/(lobby)/create-friendly")}
                variant="outline"
                style={styles.friendlyButton}
              />
              <Button
                title="Rejoindre une partie amicale"
                onPress={() => router.push("/(lobby)/join-friendly")}
                variant="outline"
                style={styles.friendlyButton}
              />
            </View>
          </View>

          <Button
            title="Retour"
            onPress={() => router.back()}
            variant="ghost"
            style={styles.backButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
