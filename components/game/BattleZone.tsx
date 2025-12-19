import { Colors } from "@/constants/theme";
import { Rank, Suit } from "@/convex/validators";
import { useColors } from "@/hooks/useColors";
import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { CardStack } from "./CardStack";

interface Card {
  suit: Suit;
  rank: Rank;
}

interface BattleZoneProps {
  opponentCards: Card[];
  playerCards: Card[];
  leadSuit?: Suit;
  battleLayout?: "vertical" | "horizontal";
}

const SUIT_IMAGES: Record<Suit, any> = {
  spades: require("@/assets/images/suit_spade.svg"),
  clubs: require("@/assets/images/suit_club.svg"),
  hearts: require("@/assets/images/suit_heart.svg"),
  diamonds: require("@/assets/images/suit_diamond.svg"),
};

export function BattleZone({
  opponentCards,
  playerCards,
  leadSuit,
  battleLayout = "vertical",
}: BattleZoneProps) {
  const colors = useColors();
  const isDark = colors.background === Colors.dark.background;

  const styles = StyleSheet.create({
    container: {
      alignItems: "center",
      paddingVertical: 12,
      gap: 12,
    },
    suitIndicator: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor:
        isDark ? `rgba(15, 20, 25, 0.7)` : `rgba(42, 59, 77, 0.15)`,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor:
        isDark ? `rgba(166, 130, 88, 0.3)` : `rgba(166, 130, 88, 0.25)`,
    },
    suitLabel: {
      fontSize: 10,
      letterSpacing: 0.5,
      color: isDark ? Colors.gameUI.bleuSurface : colors.mutedForeground,
      fontWeight: "500",
    },
    suitIcon: {
      width: 20,
      height: 20,
    },
    battleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
      marginTop: 8,
    },
    battleColumn: {
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      marginTop: 8,
    },
    playerSection: {
      alignItems: "center",
      gap: 6,
    },
    slotLabel: {
      fontSize: 10,
      letterSpacing: 0.8,
      textTransform: "uppercase",
      color: isDark ? Colors.gameUI.bleuSurface : colors.mutedForeground,
      fontWeight: "500",
    },
    vsDivider: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark ? Colors.gameUI.bleuProfond : colors.card,
      borderWidth: 2,
      borderColor: isDark ? Colors.gameUI.orSable : Colors.gameUI.orSable,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    vsText: {
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 0.8,
      color: isDark ? Colors.gameUI.orClair : Colors.gameUI.orSable,
    },
  });

  return (
    <View style={styles.container}>
      {leadSuit && (
        <View style={styles.suitIndicator}>
          <Text style={styles.suitLabel}>Couleur demandée</Text>
          <Image
            source={SUIT_IMAGES[leadSuit]}
            style={styles.suitIcon}
            contentFit="contain"
          />
        </View>
      )}

      {battleLayout === "vertical" ?
        <View style={styles.battleRow}>
          <View style={styles.playerSection}>
            <Text style={styles.slotLabel}>Adversaire</Text>
            <CardStack
              cards={opponentCards}
              orientation="vertical"
              layout="compact"
              size="large"
              showEmptySlot={opponentCards.length === 0}
            />
          </View>

          <View style={styles.vsDivider}>
            <Text style={styles.vsText}>VS</Text>
          </View>

          <View style={styles.playerSection}>
            <Text style={styles.slotLabel}>Vous</Text>
            <CardStack
              cards={playerCards}
              orientation="vertical"
              layout="compact"
              size="large"
              showEmptySlot={playerCards.length === 0}
            />
          </View>
        </View>
      : <View style={styles.battleColumn}>
          <View style={styles.playerSection}>
            <Text style={styles.slotLabel}>Adversaire</Text>
            <CardStack
              cards={opponentCards}
              orientation="horizontal"
              layout="verycompact"
              size="large"
              showEmptySlot={opponentCards.length === 0}
            />
          </View>

          <View style={styles.vsDivider}>
            <Text style={styles.vsText}>VS</Text>
          </View>

          <View style={styles.playerSection}>
            <Text style={styles.slotLabel}>Vous</Text>
            <CardStack
              cards={playerCards}
              orientation="horizontal"
              layout="verycompact"
              size="large"
              showEmptySlot={playerCards.length === 0}
            />
          </View>
        </View>
      }
    </View>
  );
}
