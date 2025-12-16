import { Platform } from "react-native";

export interface ShadowStyle {
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?: number;
  elevation?: number; // Android
}

/**
 * Ombre standard pour les cartes
 */
export function getCardShadow(color: string = "#000000"): ShadowStyle {
  if (Platform.OS === "android") {
    return {
      elevation: 4,
    };
  }

  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  };
}

/**
 * Ombre grande pour les cartes
 */
export function getLargeCardShadow(color: string = "#000000"): ShadowStyle {
  if (Platform.OS === "android") {
    return {
      elevation: 8,
    };
  }

  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  };
}

/**
 * Ombre pour les boutons
 */
export function getButtonShadow(color: string = "#000000"): ShadowStyle {
  if (Platform.OS === "android") {
    return {
      elevation: 2,
    };
  }

  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  };
}

/**
 * Ombre pour les boutons hover/active
 */
export function getButtonShadowHover(color: string = "#000000"): ShadowStyle {
  if (Platform.OS === "android") {
    return {
      elevation: 4,
    };
  }

  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  };
}

/**
 * Ombre pour les modals
 */
export function getModalShadow(color: string = "#000000"): ShadowStyle {
  if (Platform.OS === "android") {
    return {
      elevation: 12,
    };
  }

  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  };
}

/**
 * Ombre pour les cartes jouables (avec effet pulse)
 */
export function getPlayableCardShadow(color: string = "#B4443E"): ShadowStyle {
  if (Platform.OS === "android") {
    return {
      elevation: 6,
    };
  }

  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  };
}
