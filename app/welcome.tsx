import { AuthBackground } from "@/components/ui/AuthBackground";
import { Button } from "@/components/ui/Button";
import { WelcomeCards } from "@/components/ui/WelcomeCards";
import { useColors } from "@/hooks/useColors";
import { useWarmUpBrowser } from "@/hooks/useWarmUpBrowser";
import { useSSO } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WelcomeScreen() {
  const colors = useColors();
  useWarmUpBrowser();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const { startSSOFlow } = useSSO();

  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.8);
  const logoTranslateY = useSharedValue(-20);

  const taglineOpacity = useSharedValue(0);
  const taglineTranslateY = useSharedValue(-10);

  const button1Opacity = useSharedValue(0);
  const button1TranslateX = useSharedValue(-30);
  const button1Scale = useSharedValue(0.95);

  const button2Opacity = useSharedValue(0);
  const button2TranslateX = useSharedValue(-30);
  const button2Scale = useSharedValue(0.95);

  const footerOpacity = useSharedValue(0);
  const footerTranslateY = useSharedValue(10);

  useEffect(() => {
    logoOpacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
    logoScale.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
    logoTranslateY.value = withTiming(0, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });

    taglineOpacity.value = withDelay(
      200,
      withTiming(1, {
        duration: 500,
        easing: Easing.out(Easing.ease),
      })
    );
    taglineTranslateY.value = withDelay(
      200,
      withTiming(0, {
        duration: 500,
        easing: Easing.out(Easing.ease),
      })
    );

    button1Opacity.value = withDelay(
      400,
      withTiming(1, {
        duration: 500,
        easing: Easing.out(Easing.ease),
      })
    );
    button1TranslateX.value = withDelay(
      400,
      withTiming(0, {
        duration: 500,
        easing: Easing.out(Easing.ease),
      })
    );
    button1Scale.value = withDelay(
      400,
      withTiming(1, {
        duration: 500,
        easing: Easing.out(Easing.ease),
      })
    );

    button2Opacity.value = withDelay(
      500,
      withTiming(1, {
        duration: 500,
        easing: Easing.out(Easing.ease),
      })
    );
    button2TranslateX.value = withDelay(
      500,
      withTiming(0, {
        duration: 500,
        easing: Easing.out(Easing.ease),
      })
    );
    button2Scale.value = withDelay(
      500,
      withTiming(1, {
        duration: 500,
        easing: Easing.out(Easing.ease),
      })
    );

    footerOpacity.value = withDelay(
      700,
      withTiming(1, {
        duration: 400,
        easing: Easing.out(Easing.ease),
      })
    );
    footerTranslateY.value = withDelay(
      700,
      withTiming(0, {
        duration: 400,
        easing: Easing.out(Easing.ease),
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      { scale: logoScale.value },
      { translateY: logoTranslateY.value },
    ],
  }));

  const taglineAnimatedStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineTranslateY.value }],
  }));

  const button1AnimatedStyle = useAnimatedStyle(() => ({
    opacity: button1Opacity.value,
    transform: [
      { translateX: button1TranslateX.value },
      { scale: button1Scale.value },
    ],
  }));

  const button2AnimatedStyle = useAnimatedStyle(() => ({
    opacity: button2Opacity.value,
    transform: [
      { translateX: button2TranslateX.value },
      { scale: button2Scale.value },
    ],
  }));

  const footerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: footerOpacity.value,
    transform: [{ translateY: footerTranslateY.value }],
  }));

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
      color: colors.primary,
      textAlign: "center",
      marginBottom: 16,
      letterSpacing: 1,
    },
    tagline: {
      fontSize: 18,
      color: colors.foreground,
      textAlign: "center",
      lineHeight: 26,
      opacity: 0.85,
    },
    taglineHighlight: {
      color: colors.primary,
      fontWeight: "600",
    },
    buttons: {
      gap: 16,
    },
    oauthButton: {
      minHeight: 56,
    },
    footer: {
      marginTop: 32,
      alignItems: "center",
    },
    footerText: {
      fontSize: 12,
      color: colors.mutedForeground,
      opacity: 0.8,
      textAlign: "center",
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <AuthBackground />
      <WelcomeCards />
      <View style={styles.content}>
        <View style={styles.branding}>
          <Animated.View style={logoAnimatedStyle}>
            <Text style={styles.title}>Lamap</Text>
          </Animated.View>
          <Animated.View style={taglineAnimatedStyle}>
            <Text style={styles.tagline}>
              Le duel de cartes{" "}
              <Text style={styles.taglineHighlight}>épique</Text> vous attend !
            </Text>
          </Animated.View>
        </View>

        <View style={styles.buttons}>
          <Animated.View style={button1AnimatedStyle}>
            <Button
              title="Continuer avec Google"
              onPress={() => handleOAuth("google")}
              loading={loading === "google"}
              disabled={!!loading}
              variant="oauth"
              icon={
                <Ionicons name="logo-google" size={20} color={colors.accent} />
              }
              style={styles.oauthButton}
            />
          </Animated.View>
          <Animated.View style={button2AnimatedStyle}>
            <Button
              title="Continuer avec Facebook"
              onPress={() => handleOAuth("facebook")}
              loading={loading === "facebook"}
              disabled={!!loading}
              variant="primary"
              icon={
                <Ionicons
                  name="logo-facebook"
                  size={20}
                  color={colors.accentForeground}
                />
              }
              style={styles.oauthButton}
            />
          </Animated.View>
        </View>

        <Animated.View style={[styles.footer, footerAnimatedStyle]}>
          <Text style={styles.footerText}>
            Devenez maître du Garame !{"\n"}Affrontez des joueurs, misez d&apos;
            l&apos;argent.
          </Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
