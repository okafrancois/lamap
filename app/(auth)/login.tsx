import { Button } from "@/components/ui/Button";
import { Colors } from "@/constants/theme";
import { useWarmUpBrowser } from "@/hooks/useWarmUpBrowser";
import { useOAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

export default function LoginScreen() {
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
          "Une erreur est survenue lors de la connexion"
      );
    } finally {
      setLoading(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Connexion</Text>
        <Text style={styles.subtitle}>Connectez-vous pour jouer</Text>

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
      </View>
    </View>
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
  },
  oauthButton: {
    minHeight: 56,
  },
});
