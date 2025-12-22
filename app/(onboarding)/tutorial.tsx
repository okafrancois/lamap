import { Button } from "@/components/ui/Button";
import type { IconSymbolName } from "@/components/ui/icon-symbol";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { api } from "@/convex/_generated/api";
import { getCurrencyFromCountry } from "@/convex/currencies";
import { useAuth } from "@/hooks/useAuth";
import { useColors } from "@/hooks/useColors";
import { useMutation } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

interface TutorialStep {
  id: number;
  title: string;
  content: string;
  icon: IconSymbolName;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 1,
    title: "Bienvenue sur LaMap241 !",
    content:
      "Vous allez apprendre les bases du jeu de cartes compétitif. L'objectif est simple : remporter le 5ème et dernier tour pour gagner la partie.",
    icon: "gamecontroller.fill",
  },
  {
    id: 2,
    title: "Les règles de base",
    content:
      "Chaque joueur reçoit 5 cartes. Vous jouez avec les cartes de 3 à 10 (sauf le 10 de pique). Il y a 4 couleurs : ♠️ Pique, ♣️ Trèfle, ♦️ Carreau, ♥️ Cœur.",
    icon: "suit.spade.fill",
  },
  {
    id: 3,
    title: "La mécanique principale",
    content:
      "Le joueur qui a la 'main' choisit la couleur à jouer. L'adversaire DOIT répondre avec la même couleur s'il en a une. La carte la plus haute remporte la main pour le tour suivant.",
    icon: "hand.raised.fill",
  },
  {
    id: 4,
    title: "Types de victoire",
    content:
      "• Victoire normale : Gagner le tour 5\n• Kora : Gagner le tour 5 avec un 3 (×2)\n• 33 Export : Gagner les tours 4 et 5 avec des 3 (×4)\n• 333 Export : Gagner les tours 3, 4 et 5 avec des 3 (×8)",
    icon: "trophy.fill",
  },
  {
    id: 5,
    title: "Victoires automatiques",
    content:
      "Vous gagnez automatiquement si :\n• Votre main fait moins de 21 points (main faible)\n• Vous avez 3 cartes de valeur 7 (triple 7)\n• La somme de vos cartes fait 31 ou plus",
    icon: "bolt.fill",
  },
  {
    id: 6,
    title: "Partie guidée",
    content:
      "Maintenant, vous allez jouer une partie d'entraînement contre l'IA. Je vais vous guider à chaque étape pour vous familiariser avec le jeu.",
    icon: "star.fill",
  },
  {
    id: 7,
    title: "C'est parti !",
    content:
      "Vous êtes prêt à jouer ! Complétez le tutoriel pour recevoir 500 Kora de récompense, puis lancez-vous dans votre première partie.",
    icon: "trophy.fill",
  },
];

export default function TutorialScreen() {
  const colors = useColors();
  const router = useRouter();
  const { convexUser } = useAuth();
  const params = useLocalSearchParams<{ step?: string }>();
  const initialStep = params.step ? parseInt(params.step, 10) - 1 : 0;
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isCompleting, setIsCompleting] = useState(false);

  const completeTutorialMutation = useMutation(api.onboarding.completeTutorial);
  const completeOnboardingMutation = useMutation(
    api.onboarding.completeOnboarding
  );
  const createAIGameMutation = useMutation(api.matchmaking.createMatchVsAI);

  const handleNext = async () => {
    if (currentStep === 5) {
      // Étape "Partie guidée" - créer une partie AI et lancer le jeu
      if (!convexUser?._id) return;
      try {
        const currency =
          convexUser.country ?
            getCurrencyFromCountry(convexUser.country)
          : "XAF";
        const gameId = await createAIGameMutation({
          playerId: convexUser._id,
          difficulty: "easy",
          betAmount: 0,
          currency: currency as "XAF" | "EUR" | "USD",
        });
        router.push(`/(game)/match/${gameId}?tutorial=true`);
      } catch (error) {
        console.error("Erreur lors de la création de la partie:", error);
        setCurrentStep(currentStep + 1);
      }
    } else if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    if (!convexUser?._id) return;
    try {
      await completeOnboardingMutation({ userId: convexUser._id });
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Erreur lors du saut du tutoriel:", error);
      router.replace("/(tabs)");
    }
  };

  const handleComplete = async () => {
    if (!convexUser?._id || isCompleting) return;

    try {
      setIsCompleting(true);
      await completeTutorialMutation({ userId: convexUser._id });
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Erreur lors de la complétion du tutoriel:", error);
    } finally {
      setIsCompleting(false);
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
    stepIndicator: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 32,
      gap: 8,
    },
    stepDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.border,
    },
    stepDotActive: {
      backgroundColor: colors.primary,
      width: 24,
    },
    stepContent: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    iconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.accent,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 32,
    },
    title: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
      marginBottom: 16,
    },
    contentText: {
      fontSize: 16,
      color: colors.text,
      lineHeight: 24,
      textAlign: "center",
      marginBottom: 32,
    },
    footer: {
      padding: 24,
      paddingBottom: 32,
      gap: 12,
    },
    buttonRow: {
      flexDirection: "row",
      gap: 12,
    },
    progressText: {
      fontSize: 14,
      color: colors.mutedForeground,
      textAlign: "center",
      marginBottom: 8,
    },
  });

  const currentStepData = TUTORIAL_STEPS[currentStep];
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.content}>
        <View style={styles.stepIndicator}>
          {TUTORIAL_STEPS.map((_, index) => (
            <View
              key={index}
              style={[
                styles.stepDot,
                index === currentStep && styles.stepDotActive,
              ]}
            />
          ))}
        </View>

        <Animated.View
          entering={FadeInUp.duration(400)}
          style={styles.stepContent}
        >
          <View style={styles.iconContainer}>
            <IconSymbol
              name={currentStepData.icon}
              size={64}
              color={colors.primary}
            />
          </View>
          <Text style={styles.title}>{currentStepData.title}</Text>
          <Text style={styles.contentText}>{currentStepData.content}</Text>
        </Animated.View>
      </View>

      <Animated.View entering={FadeInDown.duration(400)} style={styles.footer}>
        <Text style={styles.progressText}>
          Étape {currentStep + 1} / {TUTORIAL_STEPS.length}
        </Text>
        <View style={styles.buttonRow}>
          {currentStep > 0 && (
            <Button
              title="Précédent"
              onPress={handlePrevious}
              variant="outline"
              style={{ flex: 1 }}
            />
          )}
          <Button
            title={
              isLastStep ? "Terminer"
              : currentStep === 5 ?
                "Commencer la partie"
              : "Suivant"
            }
            onPress={handleNext}
            variant="primary"
            style={{ flex: 1 }}
            loading={isCompleting && isLastStep}
          />
        </View>
        {!isLastStep && (
          <Button
            title="Passer le tutoriel"
            onPress={handleSkip}
            variant="secondary"
          />
        )}
      </Animated.View>
    </SafeAreaView>
  );
}
