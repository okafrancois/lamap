import { AuthBackground } from "@/components/ui/AuthBackground";
import { Button } from "@/components/ui/Button";
import { useColors } from "@/hooks/useColors";
import { useWarmUpBrowser } from "@/hooks/useWarmUpBrowser";
import { useSSO } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WelcomeScreen() {
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
      padding: 32,
      zIndex: 1,
    },
    branding: {
      alignItems: "center",
      marginBottom: 80,
    },
    title: {
      fontSize: 48,
      fontWeight: "700",
      color: "#A68258",
      textAlign: "center",
      marginBottom: 16,
      letterSpacing: 1,
    },
    tagline: {
      fontSize: 18,
      color: "#F5F2ED",
      textAlign: "center",
      lineHeight: 26,
      opacity: 0.9,
    },
    taglineHighlight: {
      color: "#B4443E",
      fontWeight: "600",
    },
    buttons: {
      gap: 16,
    },
    oauthButton: {
      minHeight: 56,
      borderRadius: 12,
    },
    footer: {
      marginTop: 32,
      alignItems: "center",
    },
    footerText: {
      fontSize: 12,
      color: "#F5F2ED",
      opacity: 0.5,
      textAlign: "center",
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <AuthBackground />
      <View style={styles.content}>
        <View style={styles.branding}>
          <Text style={styles.title}>Lamap</Text>
          <Text style={styles.tagline}>
            Le duel de cartes{" "}
            <Text style={styles.taglineHighlight}>épique</Text> vous attend !
          </Text>
        </View>

        <View style={styles.buttons}>
          <Button
            title="Continuer avec Google"
            onPress={() => handleOAuth("google")}
            loading={loading === "google"}
            disabled={!!loading}
            variant="oauth"
            icon={<Ionicons name="logo-google" size={20} color="#1A1A1A" />}
            style={styles.oauthButton}
          />
          <Button
            title="Continuer avec Facebook"
            onPress={() => handleOAuth("facebook")}
            loading={loading === "facebook"}
            disabled={!!loading}
            variant="secondary"
            icon={<Ionicons name="logo-facebook" size={20} color="#FFFFFF" />}
            style={styles.oauthButton}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Devenez maître du Garame !{"\n"}Affrontez des joueurs, misez d&apos;
            l&apos;argent.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
