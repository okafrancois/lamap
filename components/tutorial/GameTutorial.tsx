import { TooltipHint } from "@/components/tutorial/TooltipHint";
import { TutorialOverlay } from "@/components/tutorial/TutorialOverlay";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

interface TutorialStep {
  id: string;
  title: string;
  message: string;
  icon?: string;
  target?: "hand" | "battle" | "opponent" | "turn" | "demanded-suit";
  position?: "top" | "bottom" | "left" | "right";
  condition?: (gameState?: any, isMyTurn?: boolean) => boolean;
}

interface GameTutorialProps {
  children: React.ReactNode;
  gameState?: any;
  currentRound?: number;
  isMyTurn?: boolean;
  onTutorialComplete?: () => void;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "intro",
    title: "Partie d'entraînement",
    message:
      "Bienvenue dans la partie guidée ! Je vais vous expliquer chaque élément au fur et à mesure. Commencez par examiner votre main de 5 cartes.",
    icon: "gamecontroller.fill",
    target: "hand",
    position: "bottom",
  },
  {
    id: "your-hand",
    title: "Votre main",
    message:
      "Voici vos 5 cartes. Vous pouvez les voir en bas de l'écran. Les cartes jouables sont mises en évidence. Touchez une carte pour la sélectionner, puis touchez-la à nouveau pour la jouer.",
    target: "hand",
    position: "bottom",
    condition: () => true,
  },
  {
    id: "turn-indicator",
    title: "Indicateur de tour",
    message:
      "Cet indicateur montre le tour actuel (1 à 5). Seul le 5ème tour compte pour la victoire !",
    target: "turn",
    position: "top",
    condition: () => true,
  },
  {
    id: "demanded-suit",
    title: "Couleur demandée",
    message:
      "Lorsqu'une couleur est demandée, vous devez répondre avec la même couleur si vous en possédez une. Sinon, vous pouvez défausser n'importe quelle carte.",
    target: "demanded-suit",
    position: "top",
    condition: (gameState?: any) => gameState?.demandedSuit != null,
  },
  {
    id: "battle-zone",
    title: "Zone de jeu",
    message:
      "C'est ici que les cartes sont jouées. La carte la plus haute remporte la main pour le tour suivant.",
    target: "battle",
    position: "bottom",
    condition: () => true,
  },
  {
    id: "play-card",
    title: "Jouez une carte",
    message:
      "C'est votre tour ! Sélectionnez une carte de votre main et jouez-la. Si une couleur est demandée, essayez de suivre la couleur.",
    target: "hand",
    position: "bottom",
    condition: (_gameState?: any, isMyTurn?: boolean) => isMyTurn === true,
  },
];

export function GameTutorial({
  children,
  gameState,
  currentRound = 1,
  isMyTurn = false,
  onTutorialComplete,
}: GameTutorialProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [overlayVisible, setOverlayVisible] = useState(true);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const currentStep = TUTORIAL_STEPS[currentStepIndex];

  useEffect(() => {
    if (currentStep?.condition) {
      const shouldShow = currentStep.condition(gameState, isMyTurn);
      if (shouldShow && !overlayVisible) {
        setTooltipVisible(true);
      }
    } else if (currentStep) {
      setTooltipVisible(true);
    }
  }, [currentStep, gameState, isMyTurn, overlayVisible]);

  const handleOverlayContinue = () => {
    if (currentStepIndex < TUTORIAL_STEPS.length - 1) {
      setOverlayVisible(false);
      setTooltipVisible(true);
    } else {
      handleTutorialComplete();
    }
  };

  const handleTooltipContinue = () => {
    if (currentStepIndex < TUTORIAL_STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      setTooltipVisible(false);
      if (TUTORIAL_STEPS[currentStepIndex + 1]) {
        setOverlayVisible(true);
      }
    } else {
      handleTutorialComplete();
    }
  };

  const handleTutorialComplete = () => {
    setOverlayVisible(false);
    setTooltipVisible(false);
    if (onTutorialComplete) {
      onTutorialComplete();
    }
  };

  const handleSkip = () => {
    handleTutorialComplete();
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    tooltipContainer: {
      position: "absolute",
      bottom: 220,
      left: 0,
      right: 0,
      alignItems: "center",
      zIndex: 1000,
    },
    tooltipHand: {
      position: "absolute",
      bottom: 20,
      left: "50%",
      marginLeft: -140,
      zIndex: 1000,
    },
    tooltipBattle: {
      position: "absolute",
      top: "50%",
      left: "50%",
      marginLeft: -140,
      marginTop: -50,
      zIndex: 1000,
    },
    tooltipTurn: {
      position: "absolute",
      top: 80,
      left: "50%",
      marginLeft: -140,
      zIndex: 1000,
    },
    tooltipOpponent: {
      position: "absolute",
      top: 120,
      left: "50%",
      marginLeft: -140,
      zIndex: 1000,
    },
    tooltipDemandedSuit: {
      position: "absolute",
      top: 150,
      left: "50%",
      marginLeft: -140,
      zIndex: 1000,
    },
  });

  const getTooltipPosition = () => {
    if (!currentStep?.target) return styles.tooltipContainer;

    switch (currentStep.target) {
      case "hand":
        return styles.tooltipHand;
      case "battle":
        return styles.tooltipBattle;
      case "turn":
        return styles.tooltipTurn;
      case "opponent":
        return styles.tooltipOpponent;
      case "demanded-suit":
        return styles.tooltipDemandedSuit;
      default:
        return styles.tooltipContainer;
    }
  };

  return (
    <View style={styles.container}>
      {children}
      <TutorialOverlay
        visible={overlayVisible}
        title={currentStep?.title || ""}
        message={currentStep?.message || ""}
        icon={currentStep?.icon}
        onContinue={handleOverlayContinue}
        onSkip={handleSkip}
        showSkip={true}
        position="bottom"
      />
      {currentStep && (
        <View style={getTooltipPosition()}>
          <TooltipHint
            visible={tooltipVisible && !overlayVisible}
            message={currentStep.message}
            position={currentStep.position || "top"}
            icon={currentStep.icon}
            onPress={handleTooltipContinue}
          />
        </View>
      )}
    </View>
  );
}
