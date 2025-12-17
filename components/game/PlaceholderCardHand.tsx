import React from "react";
import { StyleSheet, View } from "react-native";
import { CardBack } from "./CardBack";

interface PlaceholderCardHandProps {
  cardCount?: number;
}

export function PlaceholderCardHand({
  cardCount = 5,
}: PlaceholderCardHandProps) {
  const cards = Array.from({ length: cardCount }, (_, i) => i);

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 20,
      height: 120,
    },
    cardWrapper: {
      marginLeft: -20,
    },
    cardWrapperFirst: {
      marginLeft: 0,
    },
  });

  return (
    <View style={styles.container}>
      {cards.map((i) => (
        <View
          key={i}
          style={[styles.cardWrapper, i === 0 && styles.cardWrapperFirst]}
        >
          <CardBack size="large" />
        </View>
      ))}
    </View>
  );
}
