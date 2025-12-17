import { Colors } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { PlayingCard } from "./PlayingCard";

type Suit = "hearts" | "diamonds" | "clubs" | "spades";
type Rank = "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10";

interface Card {
  suit: Suit;
  rank: Rank;
}

interface BattleZoneProps {
  opponentCard?: Card | null;
  playerCard?: Card | null;
  leadSuit?: Suit;
}

const SUIT_IMAGES: Record<Suit, any> = {
  spades: require("@/assets/images/suit_spade.svg"),
  clubs: require("@/assets/images/suit_club.svg"),
  hearts: require("@/assets/images/suit_heart.svg"),
  diamonds: require("@/assets/images/suit_diamond.svg"),
};

export function BattleZone({
  opponentCard,
  playerCard,
  leadSuit,
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
      gap: 16,
      marginTop: 8,
    },
    cardSlot: {
      alignItems: "center",
      gap: 8,
    },
    slotLabel: {
      fontSize: 10,
      letterSpacing: 0.8,
      textTransform: "uppercase",
      color: isDark ? Colors.gameUI.bleuSurface : colors.mutedForeground,
      fontWeight: "500",
    },
    emptySlot: {
      width: 90,
      height: 126,
      borderRadius: 8,
      backgroundColor:
        isDark ? `rgba(42, 59, 77, 0.4)` : `rgba(70, 93, 116, 0.15)`,
      borderWidth: 2,
      borderStyle: "dashed",
      borderColor:
        isDark ? `rgba(166, 130, 88, 0.35)` : `rgba(166, 130, 88, 0.3)`,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyHint: {
      fontSize: 28,
      color: isDark ? `rgba(166, 130, 88, 0.35)` : `rgba(166, 130, 88, 0.3)`,
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

      <View style={styles.battleRow}>
        <View style={styles.cardSlot}>
          <Text style={styles.slotLabel}>Adversaire</Text>
          {opponentCard ?
            <PlayingCard
              suit={opponentCard.suit}
              rank={opponentCard.rank}
              state="played"
              size="large"
            />
          : <View style={styles.emptySlot}>
              <Text style={styles.emptyHint}>?</Text>
            </View>
          }
        </View>

        <View style={styles.vsDivider}>
          <Text style={styles.vsText}>VS</Text>
        </View>

        <View style={styles.cardSlot}>
          <Text style={styles.slotLabel}>Vous</Text>
          {playerCard ?
            <PlayingCard
              suit={playerCard.suit}
              rank={playerCard.rank}
              state="played"
              size="large"
            />
          : <View style={styles.emptySlot}>
              <Text style={styles.emptyHint}>?</Text>
            </View>
          }
        </View>
      </View>
    </View>
  );
}
