import { Button } from "@/components/ui/Button";
import { Colors } from "@/constants/theme";
import { useWarmUpBrowser } from "@/hooks/useWarmUpBrowser";
import { useOAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RegisterScreen() {
  useWarmUpBrowser();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const { startOAuthFlow: startGoogleOAuth } = useOAuth({
    strategy: "oauth_google",
  });
  const { startOAuthFlow: startFacebookOAuth } = useOAuth({
    strategy: "oauth_facebook",
  });

  const handleOAuth = async (strategy: "google" | "facebook") => {
    try {
      setLoading(strategy);
      const startOAuthFlow =
        strategy === "google" ? startGoogleOAuth : startFacebookOAuth;

      const { createdSessionId, setActive } = await startOAuthFlow();

      if (createdSessionId) {
        await setActive!({ session: createdSessionId });
        router.replace("/(tabs)");
      }
    } catch (err: any) {
      Alert.alert(
        "Erreur",
        err.errors?.[0]?.message ||
          "Une erreur est survenue lors de l'inscription"
      );
    } finally {
      setLoading(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.content}>
        <Text style={styles.title}>Inscription</Text>
        <Text style={styles.subtitle}>Créez votre compte pour commencer</Text>

        <View style={styles.options}>
          <Button
            title="Continuer avec Google"
            onPress={() => handleOAuth("google")}
            loading={loading === "google"}
            disabled={!!loading}
            variant="primary"
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
          <Text style={styles.footerText}>Déjà un compte ? </Text>
          <Text
            style={styles.link}
            onPress={() => router.push("/(auth)/login")}
          >
            Se connecter
          </Text>
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
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.derived.white,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.derived.blueLight,
    textAlign: "center",
    marginBottom: 48,
  },
  options: {
    gap: 16,
    marginBottom: 32,
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
    color: Colors.derived.blueLight,
    fontSize: 14,
  },
  link: {
    color: Colors.primary.gold,
    fontSize: 14,
    fontWeight: "600",
  },
});
