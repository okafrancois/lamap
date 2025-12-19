import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet } from "react-native";

interface BackgroundGradientProps {
  children: React.ReactNode;
}

export function BackgroundGradient({ children }: BackgroundGradientProps) {
  const colors: readonly [string, string, string] = [
    "#2E3D4D",
    "#3A4D5F",
    "#2E3D4D",
  ];

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
