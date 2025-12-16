import { useColors } from "@/hooks/useColors";
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
  currentPlays?: any[];
  currentRound?: number;
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
  const colors = useColors();
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

  const badgeStyles = StyleSheet.create({
    badge: {
      backgroundColor: colors.secondary,
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
      borderColor: colors.background,
    },
    winBadge: {
      backgroundColor: colors.secondary,
      borderColor: colors.secondary,
    },
    badgeText: {
      color: colors.secondaryForeground,
      fontSize: 12,
      fontWeight: "700",
    },
  });

  return (
    <Animated.View style={[styles.column, animatedStyle]}>
      <View style={styles.cardContainer}>
        <PlayingCard
          suit={opCard.suit}
          rank={opCard.rank}
          state="played"
          size="medium"
        />
      </View>

      <View style={[badgeStyles.badge, isWin && badgeStyles.winBadge]}>
        <Text style={badgeStyles.badgeText}>{result.turn}</Text>
      </View>

      <View style={styles.cardContainer}>
        <PlayingCard
          suit={myCard.suit}
          rank={myCard.rank}
          state="played"
          size="medium"
        />
      </View>
    </Animated.View>
  );
}

function CurrentTurnCard({
  currentPlays,
  currentRound,
  myPlayerId,
  game,
}: {
  currentPlays: any[];
  currentRound: number;
  myPlayerId: string;
  game?: any;
}) {
  const colors = useColors();
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 200 });
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const myCard = currentPlays.find((pc) => pc.playerId === myPlayerId)?.card;
  const opponentCard = currentPlays.find(
    (pc) => pc.playerId !== myPlayerId
  )?.card;

  const opponent = game?.players?.find((p: any) => p.userId !== myPlayerId);

  const badgeStyles = StyleSheet.create({
    badge: {
      backgroundColor: colors.muted,
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
      borderColor: colors.background,
    },
    badgeText: {
      color: colors.mutedForeground,
      fontSize: 12,
      fontWeight: "700",
    },
    placeholderCard: {
      width: 60,
      height: 84,
      borderRadius: 8,
      borderWidth: 2,
      borderStyle: "dashed",
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.muted,
    },
  });

  return (
    <Animated.View style={[styles.column, animatedStyle]}>
      <View style={[styles.cardContainer, !opponentCard && styles.missingCard]}>
        {opponentCard ?
          <PlayingCard
            suit={opponentCard.suit}
            rank={opponentCard.rank}
            state="played"
            size="medium"
          />
        : <View style={badgeStyles.placeholderCard}>
            <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
              {opponent?.username || "Adversaire"}
            </Text>
          </View>
        }
      </View>

      <View style={badgeStyles.badge}>
        <Text style={badgeStyles.badgeText}>{currentRound}</Text>
      </View>

      <View style={[styles.cardContainer, !myCard && styles.missingCard]}>
        {myCard ?
          <PlayingCard
            suit={myCard.suit}
            rank={myCard.rank}
            state="played"
            size="medium"
          />
        : <View style={badgeStyles.placeholderCard}>
            <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
              Vous
            </Text>
          </View>
        }
      </View>
    </Animated.View>
  );
}

export function TurnHistory({
  results,
  myPlayerId,
  game,
  currentPlays,
  currentRound,
}: TurnHistoryProps) {
  if (!myPlayerId) return null;

  const showCurrentTurn =
    currentPlays &&
    currentPlays.length > 0 &&
    currentRound !== undefined &&
    results.length < currentRound;

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
        {showCurrentTurn && (
          <CurrentTurnCard
            currentPlays={currentPlays}
            currentRound={currentRound}
            myPlayerId={myPlayerId}
            game={game}
          />
        )}
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
    gap: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  column: {
    alignItems: "center",
    position: "relative",
    gap: 8,
  },
  cardContainer: {
    opacity: 0.9,
  },
  missingCard: {
    opacity: 0.4,
  },
});
