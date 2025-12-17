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
}

export function PlayerIndicator({
  name,
  hasHand = false,
  isCurrentTurn = false,
  isMe = false,
  position = "top",
}: PlayerIndicatorProps) {
  const colors = useColors();

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
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
    iconContainer: {
      flexDirection: "row",
      gap: 4,
    },
  });

  return (
    <View style={styles.container}>
      {hasHand && (
        <Ionicons
          name="crown"
          size={16}
          color={isCurrentTurn ? colors.secondaryForeground : colors.secondary}
        />
      )}
      <Text style={styles.name}>{isMe ? "Vous" : name}</Text>
      {isCurrentTurn && (
        <Ionicons
          name="play-circle"
          size={16}
          color={colors.secondaryForeground}
        />
      )}
    </View>
  );
}

