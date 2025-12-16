import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/useColors";
import { useSettings } from "@/hooks/useSettings";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { gameMode, setGameMode, isLoading } = useSettings();

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
    title: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.text,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 16,
    },
    optionContainer: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: colors.border,
    },
    optionContainerSelected: {
      borderColor: colors.secondary,
      backgroundColor: colors.accent,
    },
    optionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    optionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
    },
    optionDescription: {
      fontSize: 14,
      color: colors.mutedForeground,
      marginTop: 4,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    closeButton: {
      padding: 8,
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={colors.secondary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Paramètres</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeButton}
        >
          <IconSymbol name="xmark" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mode de jeu</Text>

            <TouchableOpacity
              style={[
                styles.optionContainer,
                gameMode === "safe" && styles.optionContainerSelected,
              ]}
              onPress={() => setGameMode("safe")}
            >
              <View style={styles.optionHeader}>
                <Text style={styles.optionTitle}>Safe</Text>
                {gameMode === "safe" && (
                  <Text style={{ color: colors.secondary, fontWeight: "600" }}>
                    ✓
                  </Text>
                )}
              </View>
              <Text style={styles.optionDescription}>
                Clic sur une carte puis appuyez sur le bouton &quot;Jouer cette
                carte&quot;
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionContainer,
                gameMode === "rapid" && styles.optionContainerSelected,
              ]}
              onPress={() => setGameMode("rapid")}
            >
              <View style={styles.optionHeader}>
                <Text style={styles.optionTitle}>Rapide</Text>
                {gameMode === "rapid" && (
                  <Text style={{ color: colors.secondary, fontWeight: "600" }}>
                    ✓
                  </Text>
                )}
              </View>
              <Text style={styles.optionDescription}>
                Double tap sur une carte pour la jouer directement
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
