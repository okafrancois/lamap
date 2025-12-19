import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useColors } from "@/hooks/useColors";
import { Button } from "@/components/ui/Button";
import { UsernameInput } from "@/components/onboarding/UsernameInput";
import { useAuth } from "@/hooks/useAuth";
import Animated, {
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";

export default function UsernameScreen() {
  const colors = useColors();
  const router = useRouter();
  const { convexUser } = useAuth();
  const [username, setUsername] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const setUsernameMutation = useMutation(api.onboarding.setUsername);
  
  const handleContinue = async () => {
    if (!convexUser?._id || !isValid) return;
    
    try {
      setIsSubmitting(true);
      await setUsernameMutation({
        userId: convexUser._id,
        username: username.toLowerCase().trim(),
      });
      router.push("/(onboarding)/country");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du username:", error);
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
      justifyContent: "center",
    },
    header: {
      marginBottom: 48,
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
    inputSection: {
      marginBottom: 32,
    },
    footer: {
      padding: 24,
      paddingBottom: 32,
    },
  });
  
  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.content}>
          <Animated.View
            entering={FadeInUp.duration(600).delay(100)}
            style={styles.header}
          >
            <Text style={styles.step}>ÉTAPE 1/2</Text>
            <Text style={styles.title}>Choisissez votre nom</Text>
            <Text style={styles.subtitle}>
              Ce sera votre identité dans le jeu. Choisissez quelque chose de mémorable !
            </Text>
          </Animated.View>
          
          <Animated.View
            entering={FadeInDown.duration(600).delay(200)}
            style={styles.inputSection}
          >
            <UsernameInput
              value={username}
              onChangeText={setUsername}
              userId={convexUser?._id}
              onValidationChange={setIsValid}
            />
          </Animated.View>
        </View>
        
        <Animated.View
          entering={FadeInUp.duration(600).delay(300)}
          style={styles.footer}
        >
          <Button
            title="Continuer"
            onPress={handleContinue}
            disabled={!isValid || isSubmitting}
            loading={isSubmitting}
            variant="primary"
          />
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

