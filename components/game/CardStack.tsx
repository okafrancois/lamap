import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { PlayingCard } from "./PlayingCard";

interface Card {
  suit: "hearts" | "diamonds" | "clubs" | "spades";
  rank: "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10";
}

interface CardStackProps {
  cards: Card[];
  size?: "small" | "medium" | "large" | "xlarge" | "xxl";
  layout?: "compact" | "fan" | "linear";
}

function AnimatedCard({
  card,
  index,
  cardX,
  size = "large",
}: {
  card: Card;
  index: number;
  cardX: number;
  size?: "small" | "medium" | "large" | "xlarge" | "xxl";
}) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  React.useEffect(() => {
    opacity.value = withDelay(index * 100, withTiming(1, { duration: 200 }));
    scale.value = withDelay(index * 100, withTiming(1, { duration: 200 }));
  }, [index, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.card,
        animatedStyle,
        {
          left: cardX,
        },
      ]}
    >
      <PlayingCard suit={card.suit} rank={card.rank} state="played" size={size} />
    </Animated.View>
  );
}

export function CardStack({ cards, size = "large", layout = "compact" }: CardStackProps) {
  if (cards.length === 0) return null;

  const screenWidth = Dimensions.get("window").width;
  const cardWidth = size === "large" ? 100 : size === "medium" ? 80 : size === "small" ? 50 : 100;
  
  const spacing = layout === "compact" ? cardWidth * 0.5 : layout === "fan" ? cardWidth * 0.75 : cardWidth * 1.2;
  
  const totalWidth = (cards.length - 1) * spacing + cardWidth;
  const startX = (screenWidth - totalWidth) / 2;

  return (
    <View style={[styles.container, { height: cardWidth * 1.4 + 20 }]}>
      {cards.map((card, index) => {
        const cardX = startX + index * spacing;
        return (
          <AnimatedCard
            key={index}
            card={card}
            index={index}
            cardX={cardX}
            size={size}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    width: "100%",
  },
  card: {
    position: "absolute",
  },
});

