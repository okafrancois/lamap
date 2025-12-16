import { ViewStyle } from "react-native";
import { Colors } from "@/constants/theme";
import { AnimationValues } from "@/constants/animations";

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
  backgroundColor: Colors.light.muted,
  // L'animation pulse sera gérée par react-native-reanimated
};

/**
 * Configuration pour l'animation Gold Shine
 */
export const goldShineConfig = {
  duration: AnimationValues.shine.duration,
  colors: {
    transparent: "transparent",
    gold: Colors.light.secondary, // Marron/Or #A68258
    goldWithOpacity: `${Colors.light.secondary}4D`, // ~30% opacity
  },
  // Le dégradé sera appliqué via LinearGradient ou style
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
