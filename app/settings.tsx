import { BattleLayoutPreview } from "@/components/settings/BattleLayoutPreview";
import { CardLayoutPreview } from "@/components/settings/CardLayoutPreview";
import { Button } from "@/components/ui/Button";
import { CURRENCY_NAMES, CURRENCY_SYMBOLS } from "@/convex/currencies";
import { useAuth } from "@/hooks/useAuth";
import { useColors } from "@/hooks/useColors";
import { useSettings } from "@/hooks/useSettings";
import { useClerk } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
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
  const { convexUser } = useAuth();
  const { signOut } = useClerk();
  const router = useRouter();
  const {
    cardLayout,
    battleLayout,
    setCardLayout,
    setBattleLayout,
    isLoading,
  } = useSettings();

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      router.replace("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }, [signOut, router]);

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

  const getCurrencyDisplay = (currency?: string) => {
    if (!currency) return "Non définie";
    const symbol = CURRENCY_SYMBOLS[currency as keyof typeof CURRENCY_SYMBOLS];
    const name = CURRENCY_NAMES[currency as keyof typeof CURRENCY_NAMES];
    return `${name} (${symbol})`;
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Compte</Text>

            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Nom d&apos;utilisateur</Text>
                <Text style={styles.settingDescription}>
                  {convexUser?.username || "Non défini"}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>

            <View style={{ height: 12 }} />

            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Pays</Text>
                <Text style={styles.settingDescription}>
                  {convexUser?.country || "Non défini"}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>

            <View style={{ height: 12 }} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Devise</Text>
                <Text style={styles.settingDescription}>
                  {getCurrencyDisplay(convexUser?.currency)}
                </Text>
              </View>
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

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Affichage des cartes jouées</Text>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingDescription}>
                  Choisissez comment les cartes jouées sont affichées pendant la
                  partie
                </Text>
              </View>
            </View>
            <View style={styles.layoutOptions}>
              <TouchableOpacity
                style={styles.layoutOption}
                onPress={() => setBattleLayout("vertical")}
              >
                <BattleLayoutPreview
                  layout="vertical"
                  isSelected={battleLayout === "vertical"}
                />
                <Text style={styles.layoutLabel}>Côte à côte</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.layoutOption}
                onPress={() => setBattleLayout("horizontal")}
              >
                <BattleLayoutPreview
                  layout="horizontal"
                  isSelected={battleLayout === "horizontal"}
                />
                <Text style={styles.layoutLabel}>Haut/Bas</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Button
              title="Se déconnecter"
              onPress={handleSignOut}
              variant="destructive"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
