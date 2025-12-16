import { Colors } from "@/constants/theme";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { PlayingCard } from "./PlayingCard";

type TurnResult = {
  turn: number;
  winnerId: string;
  winningCard: {
    suit: "hearts" | "diamonds" | "clubs" | "spades";
    rank: "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10";
  };
};

interface TurnHistoryProps {
  results: TurnResult[];
  myPlayerId: string | null | undefined;
  game?: any;
}

function AnimatedTurnResult({
  result,
  index,
  myPlayerId,
  game,
}: {
  result: TurnResult;
  index: number;
  myPlayerId: string;
  game?: any;
}) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    opacity.value = withDelay(index * 100, withTiming(1, { duration: 200 }));
    scale.value = withDelay(index * 100, withTiming(1, { duration: 200 }));
  }, [index, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!result.winningCard) return null;

  const isWin = result.winnerId === myPlayerId;

  const roundCards =
    game?.playedCards?.filter((pc: any) => pc.round === result.turn) || [];
  const winnerCard = roundCards.find(
    (pc: any) => pc.playerId === result.winnerId
  )?.card;
  const loserCard = roundCards.find(
    (pc: any) => pc.playerId !== result.winnerId
  )?.card;

  if (!winnerCard || !loserCard) return null;

  const myCard = isWin ? winnerCard : loserCard;
  const opCard = isWin ? loserCard : winnerCard;

  return (
    <Animated.View style={[styles.column, animatedStyle]}>
      <View style={styles.cardContainer}>
        <PlayingCard
          suit={opCard.suit}
          rank={opCard.rank}
          state="played"
          size="small"
        />
      </View>

      <View style={[styles.badge, isWin && styles.winBadge]}>
        <Text style={styles.badgeText}>{result.turn}</Text>
      </View>

      <View style={styles.cardContainer}>
        <PlayingCard
          suit={myCard.suit}
          rank={myCard.rank}
          state="played"
          size="small"
        />
      </View>
    </Animated.View>
  );
}

export function TurnHistory({ results, myPlayerId, game }: TurnHistoryProps) {
  if (results.length === 0 || !myPlayerId) return null;

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {results.map((result, index) => (
          <AnimatedTurnResult
            key={result.turn}
            result={result}
            index={index}
            myPlayerId={myPlayerId}
            game={game}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    alignItems: "center",
  },
  grid: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  column: {
    alignItems: "center",
    position: "relative",
    gap: 8,
  },
  cardContainer: {
    opacity: 0.9, // Slight fade for history
  },
  badge: {
    backgroundColor: Colors.primary.gold,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: "50%",
    marginTop: -12,
    zIndex: 10,
    borderWidth: 2,
    borderColor: Colors.derived.blueDark,
  },
  winBadge: {
    backgroundColor: Colors.primary.gold,
    borderColor: Colors.primary.gold,
  },
  badgeText: {
    color: Colors.derived.blueDark,
    fontSize: 12,
    fontWeight: "700",
  },
});
