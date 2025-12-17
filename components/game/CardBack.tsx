import { Colors } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

interface CardBackProps {
  size?: "small" | "medium" | "large";
  style?: ViewStyle;
}

const CARD_ASPECT_RATIO = 5 / 7;

const CARD_WIDTHS = {
  small: 32,
  medium: 60,
  large: 90,
};

export function CardBack({ size = "medium", style }: CardBackProps) {
  const colors = useColors();
  const cardWidth = CARD_WIDTHS[size];
  const cardHeight = cardWidth / CARD_ASPECT_RATIO;

  const isDark = colors.background === Colors.dark.background;

  const styles = StyleSheet.create({
    card: {
      width: cardWidth,
      height: cardHeight,
      borderRadius: size === "small" ? 5 : 8,
      padding: size === "small" ? 3 : 5,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: size === "small" ? 1.5 : 2,
      borderColor: isDark ? Colors.gameUI.orClair : Colors.gameUI.orSable,
      backgroundColor: Colors.gameUI.rougeSombre,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.4,
      shadowRadius: 4,
      elevation: 4,
    },
    innerBorder: {
      position: "absolute",
      top: size === "small" ? 3 : 5,
      left: size === "small" ? 3 : 5,
      right: size === "small" ? 3 : 5,
      bottom: size === "small" ? 3 : 5,
      borderWidth: 1,
      borderColor:
        isDark ? `rgba(212, 184, 150, 0.35)` : `rgba(166, 130, 88, 0.4)`,
      borderRadius: size === "small" ? 2 : 3,
    },
    symbol: {
      fontSize:
        size === "small" ? 10
        : size === "medium" ? 16
        : 24,
      color: isDark ? Colors.gameUI.orClair : Colors.gameUI.orSable,
      opacity: 0.7,
    },
    gradient: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "50%",
      backgroundColor: Colors.gameUI.rougeTerre,
      opacity: 0.5,
    },
  });

  return (
    <View style={[styles.card, style]}>
      <View style={styles.gradient} />
      <View style={styles.innerBorder} />
      <Text style={styles.symbol}>✦</Text>
    </View>
  );
}
