import { Colors } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { CardBack } from "./CardBack";

interface OpponentZoneProps {
  name: string;
  hasHand?: boolean;
  cardsRemaining: number;
}

export function OpponentZone({
  name,
  hasHand = false,
  cardsRemaining,
}: OpponentZoneProps) {
  const colors = useColors();
  const isDark = colors.background === Colors.dark.background;

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 12,
      gap: 12,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor:
        isDark ? Colors.gameUI.rougeTerre : Colors.gameUI.rougeSombre,
      borderWidth: 2,
      borderColor: isDark ? Colors.gameUI.orClair : Colors.gameUI.orSable,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    avatarText: {
      fontSize: 16,
      fontWeight: "700",
      color: Colors.derived.white,
    },
    info: {
      flex: 1,
      minWidth: 0,
    },
    name: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.foreground,
      marginBottom: 3,
    },
    statusRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    hasHandBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor:
        isDark ? `rgba(166, 130, 88, 0.25)` : `rgba(166, 130, 88, 0.2)`,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      borderWidth: 1,
      borderColor:
        isDark ? `rgba(212, 184, 150, 0.35)` : `rgba(166, 130, 88, 0.3)`,
    },
    hasHandIcon: {
      fontSize: 10,
    },
    hasHandText: {
      fontSize: 10,
      fontWeight: "600",
      color: isDark ? Colors.gameUI.orClair : Colors.gameUI.orSable,
    },
    cardsContainer: {
      flexDirection: "row",
      gap: 0,
    },
    cardWrapper: {
      marginLeft: -8,
    },
    cardWrapperFirst: {
      marginLeft: 0,
    },
  });

  const cards = Array.from(
    { length: Math.min(cardsRemaining, 3) },
    (_, i) => i
  );

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <View style={styles.statusRow}>
          {hasHand && (
            <View style={styles.hasHandBadge}>
              <Text style={styles.hasHandIcon}>👑</Text>
              <Text style={styles.hasHandText}>A la main</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.cardsContainer}>
        {cards.map((i) => (
          <View
            key={i}
            style={[styles.cardWrapper, i === 0 && styles.cardWrapperFirst]}
          >
            <CardBack size="small" />
          </View>
        ))}
      </View>
    </View>
  );
}
