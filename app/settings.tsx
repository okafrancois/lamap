import { CardLayoutPreview } from "@/components/settings/CardLayoutPreview";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/useColors";
import { useSettings } from "@/hooks/useSettings";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { themeMode, cardLayout, setThemeMode, setCardLayout, isLoading } =
    useSettings();

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
    settingRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
    },
    settingInfo: {
      flex: 1,
      marginRight: 16,
    },
    settingTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 4,
    },
    settingDescription: {
      fontSize: 14,
      color: colors.mutedForeground,
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
    layoutOptions: {
      flexDirection: "row",
      gap: 12,
      marginTop: 12,
    },
    layoutOption: {
      alignItems: "center",
      gap: 8,
    },
    layoutLabel: {
      fontSize: 12,
      color: colors.text,
      textAlign: "center",
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
            <Text style={styles.sectionTitle}>Apparence</Text>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Mode sombre</Text>
                <Text style={styles.settingDescription}>
                  Activer le thème sombre
                </Text>
              </View>
              <Switch
                value={themeMode === "dark"}
                onValueChange={(value) =>
                  setThemeMode(value ? "dark" : "light")
                }
                trackColor={{
                  false: colors.muted,
                  true: colors.secondary,
                }}
                thumbColor={colors.card}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Disposition des cartes</Text>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingDescription}>
                  Choisissez comment vos cartes sont affichées dans votre main
                </Text>
              </View>
            </View>
            <View style={styles.layoutOptions}>
              <TouchableOpacity
                style={styles.layoutOption}
                onPress={() => setCardLayout("fan")}
              >
                <CardLayoutPreview
                  layout="fan"
                  isSelected={cardLayout === "fan"}
                />
                <Text style={styles.layoutLabel}>Éventail</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.layoutOption}
                onPress={() => setCardLayout("linear")}
              >
                <CardLayoutPreview
                  layout="linear"
                  isSelected={cardLayout === "linear"}
                />
                <Text style={styles.layoutLabel}>Linéaire</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.layoutOption}
                onPress={() => setCardLayout("compact")}
              >
                <CardLayoutPreview
                  layout="compact"
                  isSelected={cardLayout === "compact"}
                />
                <Text style={styles.layoutLabel}>Compact</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
