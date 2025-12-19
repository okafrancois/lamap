import { Colors } from "@/constants/theme";
import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

interface CardBackProps {
  size?: "small" | "medium" | "large" | "xl" | "xxl";
  style?: ViewStyle;
}

const CARD_ASPECT_RATIO = 5 / 7;

const CARD_WIDTHS = {
  small: 32,
  medium: 60,
  large: 90,
  xl: 100,
  xxl: 140,
};

export function CardBack({ size = "medium", style }: CardBackProps) {
  const cardWidth = CARD_WIDTHS[size];
  const cardHeight = cardWidth / CARD_ASPECT_RATIO;

  const styles = StyleSheet.create({
    card: {
      width: cardWidth,
      height: cardHeight,
      borderRadius: size === "small" ? 5 : 8,
      padding: size === "small" ? 3 : 5,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: size === "small" ? 1.5 : 2,
      borderColor: Colors.gameUI.orClair,
      backgroundColor: Colors.gameUI.rougeSombre,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
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
      borderColor: `rgba(212, 184, 150, 0.35)`,
      borderRadius: size === "small" ? 2 : 3,
    },
    symbol: {
      fontSize:
        size === "small" ? 10
        : size === "medium" ? 16
        : 24,
      color: Colors.gameUI.orClair,
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
