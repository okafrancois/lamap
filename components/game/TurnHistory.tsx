import React from "react";
import { StyleSheet, View } from "react-native";
import { CardStack } from "./CardStack";

interface TurnHistoryProps {
  results: any[];
  myPlayerId: string | null | undefined;
  game?: any;
  currentPlays?: any[];
  currentRound?: number;
}

export function TurnHistory({
  results,
  myPlayerId,
  game,
  currentPlays,
}: TurnHistoryProps) {
  if (!myPlayerId) return null;

  const opponentCards: any[] = [];
  const myCards: any[] = [];

  results.forEach((result) => {
    const roundCards =
      game?.playedCards?.filter((pc: any) => pc.round === result.turn) || [];

    const myCard = roundCards.find(
      (pc: any) => pc.playerId === myPlayerId
    )?.card;
    const opCard = roundCards.find(
      (pc: any) => pc.playerId !== myPlayerId
    )?.card;

    if (opCard) opponentCards.push(opCard);
    if (myCard) myCards.push(myCard);
  });

  if (currentPlays && currentPlays.length > 0) {
    const currentMyCard = currentPlays.find(
      (pc) => pc.playerId === myPlayerId
    )?.card;
    const currentOpCard = currentPlays.find(
      (pc) => pc.playerId !== myPlayerId
    )?.card;

    if (currentOpCard) opponentCards.push(currentOpCard);
    if (currentMyCard) myCards.push(currentMyCard);
  }

  return (
    <View style={styles.container}>
      <CardStack cards={opponentCards} size="large" layout="verycompact" />
      <View style={styles.divider} />
      <CardStack cards={myCards} size="large" layout="verycompact" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingVertical: 4,
    alignItems: "center",
    gap: 8,
  },
  divider: {
    height: 1,
    width: "90%",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
});
