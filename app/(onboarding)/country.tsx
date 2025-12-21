import { CountrySelector } from "@/components/onboarding/CountrySelector";
import { Button } from "@/components/ui/Button";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useColors } from "@/hooks/useColors";
import { useMutation } from "convex/react";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CountryScreen() {
  const colors = useColors();
  const router = useRouter();
  const { convexUser } = useAuth();
  const [selectedCountry, setSelectedCountry] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setCountryMutation = useMutation(api.onboarding.setCountry);
  const completeOnboardingMutation = useMutation(
    api.onboarding.completeOnboarding
  );

  const handleCountrySelect = (countryCode: string) => {
    setSelectedCountry(countryCode);
  };

  const handleContinue = async () => {
    if (!convexUser?._id || !selectedCountry) return;

    try {
      setIsSubmitting(true);

      await setCountryMutation({
        userId: convexUser._id,
        countryCode: selectedCountry,
      });

      await completeOnboardingMutation({
        userId: convexUser._id,
      });

      router.replace("/(tabs)");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du pays:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartTutorial = async () => {
    if (!convexUser?._id || !selectedCountry) return;

    try {
      setIsSubmitting(true);

      await setCountryMutation({
        userId: convexUser._id,
        countryCode: selectedCountry,
      });

      await completeOnboardingMutation({
        userId: convexUser._id,
      });

      router.push("/(onboarding)/tutorial");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du pays:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      padding: 24,
    },
    header: {
      marginBottom: 24,
    },
    step: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontWeight: "600",
      marginBottom: 8,
    },
    title: {
      fontSize: 32,
      fontWeight: "700",
      color: colors.foreground,
      marginBottom: 12,
    },
    subtitle: {
      fontSize: 16,
      color: colors.mutedForeground,
      lineHeight: 24,
    },
    currencyInfo: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.accent,
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
    },
    currencyText: {
      fontSize: 14,
      color: colors.foreground,
      marginLeft: 8,
    },
    selectorWrapper: {
      flex: 1,
    },
    footer: {
      padding: 24,
      paddingBottom: 32,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.content}>
        <Animated.View
          entering={FadeInUp.duration(600).delay(100)}
          style={styles.header}
        >
          <Text style={styles.step}>ÉTAPE 2/2</Text>
          <Text style={styles.title}>Où jouez-vous ?</Text>
          <Text style={styles.subtitle}>
            Cela détermine la devise que vous utiliserez pour vos mises.
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(600).delay(200)}
          style={styles.selectorWrapper}
        >
          <CountrySelector
            selectedCountry={selectedCountry}
            onSelect={handleCountrySelect}
          />
        </Animated.View>
      </View>

      <Animated.View
        entering={FadeInUp.duration(600).delay(300)}
        style={styles.footer}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: colors.text,
            marginBottom: 12,
            textAlign: "center",
          }}
        >
          Apprendre à jouer ?
        </Text>
        <Button
          title="Commencer le tutoriel"
          onPress={handleStartTutorial}
          disabled={!selectedCountry || isSubmitting}
          loading={isSubmitting}
          variant="primary"
          style={{ marginBottom: 12 }}
        />
        <Button
          title="Passer, je connais déjà"
          onPress={handleContinue}
          disabled={!selectedCountry || isSubmitting}
          variant="outline"
        />
      </Animated.View>
    </SafeAreaView>
  );
}
