import { Button } from "@/components/ui/Button";
import { useColors } from "@/hooks/useColors";
import { useWarmUpBrowser } from "@/hooks/useWarmUpBrowser";
import { useSSO } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const colors = useColors();
  useWarmUpBrowser();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const { startSSOFlow } = useSSO();

  const handleOAuth = async (strategy: "google" | "facebook") => {
    try {
      setLoading(strategy);
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: `oauth_${strategy}`,
      });

      if (createdSessionId) {
        await setActive!({ session: createdSessionId });
        router.replace("/(tabs)");
      }
    } catch (err: any) {
      const errorMessage = err.errors?.[0]?.message || "";
      
      if (errorMessage.includes("Session already exists")) {
        router.replace("/(tabs)");
      } else {
        Alert.alert(
          "Erreur",
          errorMessage || "Une erreur est survenue lors de la connexion"
        );
      }
    } finally {
      setLoading(null);
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
      fontSize: 16,
      color: colors.mutedForeground,
      textAlign: "center",
      marginBottom: 48,
    },
    options: {
      gap: 16,
    },
    oauthButton: {
      minHeight: 56,
    },
    footer: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 24,
    },
    footerText: {
      color: colors.mutedForeground,
      fontSize: 14,
    },
    link: {
      color: colors.secondary,
      fontSize: 14,
      fontWeight: "600",
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.content}>
        <Text style={styles.title}>Connexion</Text>
        <Text style={styles.subtitle}>Connectez-vous pour jouer</Text>

        <View style={styles.options}>
          <Button
            title="Continuer avec Google"
            onPress={() => handleOAuth("google")}
            loading={loading === "google"}
            disabled={!!loading}
            style={styles.oauthButton}
          />
          <Button
            title="Continuer avec Facebook"
            onPress={() => handleOAuth("facebook")}
            loading={loading === "facebook"}
            disabled={!!loading}
            variant="secondary"
            style={styles.oauthButton}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Pas encore de compte ? </Text>
          <Text
            style={styles.link}
            onPress={() => router.push("/(auth)/register")}
          >
            S&apos;inscrire
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
