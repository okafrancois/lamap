import { useColors } from "@/hooks/useColors";
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
  size?: "small" | "medium" | "large" | "xl" | "xxl";
  layout?: "compact" | "fan" | "linear" | "verycompact";
  orientation?: "horizontal" | "vertical";
  highlightLastN?: number;
}

function AnimatedCard({
  card,
  index,
  cardX,
  cardY,
  size = "large",
  isOldCard = false,
}: {
  card: Card;
  index: number;
  cardX: number;
  cardY?: number;
  size?: "small" | "medium" | "large" | "xl" | "xxl";
  isOldCard?: boolean;
}) {
  const colors = useColors();
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  React.useEffect(() => {
    const targetOpacity = isOldCard ? 0.9 : 1;
    opacity.value = withDelay(
      index * 100,
      withTiming(targetOpacity, { duration: 200 })
    );
    scale.value = withDelay(index * 100, withTiming(1, { duration: 200 }));
  }, [index, isOldCard, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const desaturateOverlayStyle = StyleSheet.create({
    overlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.background,
      opacity: 0.6,
      pointerEvents: "none",
      borderRadius: 8,
    },
  });

  return (
    <Animated.View
      style={[
        styles.card,
        animatedStyle,
        {
          left: cardX,
          ...(cardY !== undefined && { top: cardY }),
        },
      ]}
    >
      <PlayingCard
        suit={card.suit}
        rank={card.rank}
        state="played"
        size={size}
      />
      {isOldCard && <View style={desaturateOverlayStyle.overlay} />}
    </Animated.View>
  );
}

export function CardStack({
  cards,
  size = "large",
  layout = "compact",
  orientation = "horizontal",
  highlightLastN = 1,
}: CardStackProps) {
  if (cards.length === 0) return null;

  const screenWidth = Dimensions.get("window").width;
  const cardWidth =
    size === "large" ? 100
    : size === "medium" ? 80
    : size === "small" ? 50
    : 100;

  const cardHeight = cardWidth * 1.4;

  if (orientation === "vertical") {
    const verticalSpacing = cardHeight * 0.25;
    const totalHeight = (cards.length - 1) * verticalSpacing + cardHeight;
    const startY = 0;
    const centerX = (screenWidth - cardWidth) / 2;

    return (
      <View style={[styles.container, { height: totalHeight + 20 }]}>
        {cards.map((card, index) => {
          const cardY = startY + index * verticalSpacing;
          const isOldCard = index < cards.length - highlightLastN;
          return (
            <AnimatedCard
              key={index}
              card={card}
              index={index}
              cardX={centerX}
              cardY={cardY}
              size={size}
              isOldCard={isOldCard}
            />
          );
        })}
      </View>
    );
  }

  const spacing =
    layout === "compact" ? cardWidth * 0.5
    : layout === "fan" ? cardWidth * 0.75
    : layout === "verycompact" ? cardWidth * 0.3
    : cardWidth * 1.2;

  const totalWidth = (cards.length - 1) * spacing + cardWidth;
  const startX = (screenWidth - totalWidth) / 2;

  return (
    <View style={[styles.container, { height: cardHeight + 20 }]}>
      {cards.map((card, index) => {
        const cardX = startX + index * spacing;
        const isOldCard = index < cards.length - highlightLastN;
        return (
          <AnimatedCard
            key={index}
            card={card}
            index={index}
            cardX={cardX}
            size={size}
            isOldCard={isOldCard}
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
