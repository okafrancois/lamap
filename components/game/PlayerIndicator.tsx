import { useColors } from "@/hooks/useColors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface PlayerIndicatorProps {
  name: string;
  hasHand?: boolean;
  isCurrentTurn?: boolean;
  isMe?: boolean;
  position?: "top" | "bottom";
  leadSuit?: "hearts" | "diamonds" | "clubs" | "spades";
}

export function PlayerIndicator({
  name,
  hasHand = false,
  isCurrentTurn = false,
  isMe = false,
  leadSuit,
}: PlayerIndicatorProps) {
  const colors = useColors();

  const suitSymbols = {
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣",
    spades: "♠",
  };

  const suitColors = {
    hearts: "#E53E3E",
    diamonds: "#E53E3E",
    clubs: "#2D3748",
    spades: "#2D3748",
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: isCurrentTurn ? colors.secondary : colors.card,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: isCurrentTurn ? colors.secondary : colors.border,
    },
    name: {
      fontSize: 14,
      fontWeight: "600",
      color: isCurrentTurn ? colors.secondaryForeground : colors.foreground,
    },
    suitText: {
      fontSize: 16,
      fontWeight: "700",
    },
  });

  return (
    <View style={styles.container}>
      {hasHand && (
        <Ionicons
          name="crown"
          size={14}
          color={isCurrentTurn ? colors.secondaryForeground : colors.secondary}
        />
      )}
      <Text style={styles.name}>{isMe ? "Vous" : name}</Text>
      {isCurrentTurn && (
        <Ionicons
          name="play-circle"
          size={14}
          color={colors.secondaryForeground}
        />
      )}
      {hasHand && leadSuit && (
        <Text
          style={[
            styles.suitText,
            {
              color:
                isCurrentTurn ?
                  colors.secondaryForeground
                : suitColors[leadSuit],
            },
          ]}
        >
          {suitSymbols[leadSuit]}
        </Text>
      )}
    </View>
  );
}
