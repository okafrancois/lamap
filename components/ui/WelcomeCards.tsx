import { PlayingCard } from "@/components/game/PlayingCard";
import React, { useEffect, useMemo } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

type Suit = "hearts" | "diamonds" | "clubs" | "spades";
type Rank = "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10";

const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
const RANKS: Rank[] = ["3", "4", "5", "6", "7", "8", "9", "10"];

interface CardData {
  suit: Suit;
  rank: Rank;
  rotation: number;
}

function generateRandomCards(count: number): CardData[] {
  const cards: CardData[] = [];
  const usedCards = new Set<string>();

  while (cards.length < count) {
    const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
    const rank = RANKS[Math.floor(Math.random() * RANKS.length)];
    const cardKey = `${suit}-${rank}`;

    if (!usedCards.has(cardKey)) {
      usedCards.add(cardKey);
      const rotationStep = 30 / (count - 1);
      const rotation = -15 + cards.length * rotationStep;
      cards.push({ suit, rank, rotation });
    }
  }

  return cards;
}

interface AnimatedCardProps {
  suit: Suit;
  rank: Rank;
  rotation: number;
  index: number;
  totalCards: number;
}

function AnimatedCard({
  suit,
  rank,
  rotation,
  index,
  totalCards,
}: AnimatedCardProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(150);
  const floatY = useSharedValue(0);
  const floatRotate = useSharedValue(0);

  const screenWidth = Dimensions.get("window").width;
  const cardWidth = 100;
  const spacing = cardWidth * 0.6;
  const totalWidth = (totalCards - 1) * spacing + cardWidth;
  const startX = (screenWidth - totalWidth) / 2 - 20;
  const cardX = startX + index * spacing;

  useEffect(() => {
    opacity.value = withDelay(
      300,
      withTiming(1, {
        duration: 800,
        easing: Easing.out(Easing.ease),
      })
    );

    translateY.value = withDelay(
      300,
      withTiming(0, {
        duration: 800,
        easing: Easing.out(Easing.back(1.2)),
      })
    );

    const floatDelay = 1100 + index * 150;

    setTimeout(() => {
      floatY.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

      floatRotate.value = withRepeat(
        withSequence(
          withTiming(-2, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
          withTiming(2, { duration: 2500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }, floatDelay);
  }, [floatRotate, floatY, index, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value + floatY.value },
      { rotate: `${rotation + floatRotate.value}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          left: cardX,
        },
        animatedStyle,
      ]}
    >
      <PlayingCard suit={suit} rank={rank} state="playable" size="xxl" />
    </Animated.View>
  );
}

export function WelcomeCards() {
  const cards = useMemo(() => generateRandomCards(5), []);

  return (
    <View style={styles.container}>
      {cards.map((card, index) => (
        <AnimatedCard
          key={`${card.suit}-${card.rank}`}
          suit={card.suit}
          rank={card.rank}
          rotation={card.rotation}
          index={index}
          totalCards={cards.length}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: -40,
    zIndex: 0,
  },
  cardWrapper: {
    position: "absolute",
    bottom: 0,
  },
});
