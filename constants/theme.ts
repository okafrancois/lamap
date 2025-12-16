import { Platform } from "react-native";

export const Colors = {
  primary: {
    red: "#B4443E",
    gold: "#A68258",
    blue: "#465D74",
  },
  derived: {
    blueDark: "#2E3D4D",
    blueLight: "#5A7A96",
    redLight: "#D4635D",
    goldLight: "#C9A876",
    white: "#F5F2ED",
    black: "#1A1A1A",
  },
  light: {
    background: "#FAFAF9",
    foreground: "#1A1A1A",
    card: "#FEFEFD",
    cardForeground: "#2A2A28",
    playingCardBackground: "#FEFEFD", // Background des cartes de jeu (identique en mode clair et sombre)
    playingCardDisabledBackground: "#D1D1D1", // Background des cartes non jouables (identique en mode clair et sombre)
    primary: "#B4443E",
    primaryForeground: "#FFFFFF",
    secondary: "#A68258",
    secondaryForeground: "#FFFFFF",
    muted: "#EBEBE8",
    mutedForeground: "#6B6B68",
    accent: "#E8E0D4",
    accentForeground: "#1A1A1A",
    destructive: "#D32F2F",
    destructiveForeground: "#FFFFFF",
    border: "#D9D1C4",
    input: "#F0F0ED",
    ring: "#B4443E",
    text: "#1A1A1A",
    tint: "#B4443E",
    icon: "#465D74",
    tabIconDefault: "#5A7A96",
    tabIconSelected: "#B4443E",
  },
  dark: {
    background: "#141923", // oklch(0.12 0.02 230) - Fond sombre bleu nuit avec texture
    foreground: "#F2F2ED", // oklch(0.95 0.01 70) - Texte clair
    card: "#282E3D", // oklch(0.16 0.03 230) - Cartes avec effet velours sombre (non transparent)
    cardForeground: "#F2F2ED", // oklch(0.95 0.01 70) - Texte clair sur cartes
    playingCardBackground: "#FEFEFD", // Background des cartes de jeu (identique en mode clair et sombre)
    playingCardDisabledBackground: "#D1D1D1", // Background des cartes non jouables (identique en mode clair et sombre)
    primary: "#C34B44", // oklch(0.58 0.22 25) - Rouge des cartes lumineux
    primaryForeground: "#FAFAF9", // oklch(0.98 0.01 70) - Texte clair
    secondary: "#B9966E", // oklch(0.68 0.1 65) - Marron doré
    secondaryForeground: "#FAFAF9", // oklch(0.98 0.01 70) - Texte clair
    muted: "#3D4554", // oklch(0.25 0.02 230) - Tons neutres sombres
    mutedForeground: "#A5A5A0", // oklch(0.65 0.02 70) - Texte sur fond muted
    accent: "#4D5A6B", // oklch(0.35 0.05 65) - Marron sombre pour les hovers
    accentForeground: "#F2F2ED", // oklch(0.95 0.01 70) - Texte clair
    destructive: "#E63946", // oklch(0.6 0.35 20) - Rouge alerte lumineux
    destructiveForeground: "#FAFAF9", // oklch(0.98 0.01 70) - Texte clair
    border: "#4D5A6B", // oklch(0.3 0.03 230) - Bordures bleu profond
    input: "#333B4A", // oklch(0.2 0.02 230) - Fond des champs de saisie sombre
    ring: "#C34B44", // oklch(0.58 0.22 25) - Couleur du focus (rouge primary)
    text: "#F5F2ED",
    tint: "#A68258",
    icon: "#5A7A96",
    tabIconDefault: "#5A7A96",
    tabIconSelected: "#A68258",
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
