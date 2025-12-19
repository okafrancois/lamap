import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useColors } from "@/hooks/useColors";
import { Button } from "@/components/ui/Button";
import { CountrySelector } from "@/components/onboarding/CountrySelector";
import { useAuth } from "@/hooks/useAuth";
import Animated, {
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";

export default function CountryScreen() {
  const colors = useColors();
  const router = useRouter();
  const { convexUser } = useAuth();
  const [selectedCountry, setSelectedCountry] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const setCountryMutation = useMutation(api.onboarding.setCountry);
  const completeOnboardingMutation = useMutation(api.onboarding.completeOnboarding);
  
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
        <Button
          title="Commencer à jouer"
          onPress={handleContinue}
          disabled={!selectedCountry || isSubmitting}
          loading={isSubmitting}
          variant="primary"
        />
      </Animated.View>
    </SafeAreaView>
  );
}

