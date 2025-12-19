import { AnimationValues } from "@/constants/animations";
import { Colors } from "@/constants/theme";
import { ViewStyle } from "react-native";

/**
 * Style pour l'état disabled
 */
export const disabledState: ViewStyle = {
  opacity: 0.5,
  pointerEvents: "none",
};

/**
 * Style pour le skeleton pulse (chargement)
 */
export const skeletonPulse: ViewStyle = {
  backgroundColor: Colors.muted,
};

/**
 * Configuration pour l'animation Gold Shine
 */
export const goldShineConfig = {
  duration: AnimationValues.shine.duration,
  colors: {
    transparent: "transparent",
    gold: Colors.secondary,
    goldWithOpacity: `${Colors.secondary}4D`,
  },
};

/**
 * Helper pour obtenir le style disabled
 */
export function getDisabledStyle(opacity: number = 0.5): ViewStyle {
  return {
    opacity,
    pointerEvents: "none" as const,
  };
}
