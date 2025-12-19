import { useColorScheme } from "@/hooks/use-color-scheme";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet } from "react-native";

interface BackgroundGradientProps {
  children: React.ReactNode;
}

export function BackgroundGradient({ children }: BackgroundGradientProps) {
  const colorScheme = useColorScheme();

  // Gradient mode sombre : bleu profond vintage
  const darkColors: readonly [string, string, string] = [
    "#2E3D4D",
    "#3A4D5F",
    "#2E3D4D",
  ];

  // Gradient mode clair : beige/crème chaleureux
  const lightColors: readonly [string, string, string] = [
    "#F5F2ED", // Blanc cassé
    "#E8E0D4", // Beige clair
    "#F5F2ED", // Blanc cassé
  ];

  const colors = colorScheme === "dark" ? darkColors : lightColors;

  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
});
