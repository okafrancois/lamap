import { Colors } from "@/constants/theme";
import { Rank, Suit } from "@/convex/validators";
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
      backgroundColor: `rgba(15, 20, 25, 0.7)`,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: `rgba(166, 130, 88, 0.3)`,
    },
    suitLabel: {
      fontSize: 10,
      letterSpacing: 0.5,
      color: Colors.gameUI.bleuSurface,
      fontWeight: "500",
    },
    suitIcon: {
      width: 20,
      height: 20,
      borderRadius: 100,
      padding: 2,
      backgroundColor: Colors.gameUI.bleuSurface,
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
      color: Colors.gameUI.bleuSurface,
      fontWeight: "500",
    },
    vsDivider: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: Colors.gameUI.bleuProfond,
      borderWidth: 2,
      borderColor: Colors.gameUI.orSable,
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
      color: Colors.gameUI.orClair,
    },
  });

  return (
    <View style={styles.container}>
      {leadSuit && (
        <View style={styles.suitIndicator}>
          <Text style={styles.suitLabel}>Carte demandée</Text>
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
