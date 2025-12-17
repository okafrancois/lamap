import { useSettings } from "@/hooks/useSettings";
import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { PlayingCard } from "./PlayingCard";

export type Card = {
  id: string;
  suit: "hearts" | "diamonds" | "clubs" | "spades";
  rank: "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10";
  playable: boolean;
};

interface CardHandProps {
  cards: Card[];
  isMyTurn: boolean;
  onCardSelect: (card: Card) => void;
  onCardDoubleTap?: (card: Card) => void;
  selectedCard?: Card | null;
  disabled?: boolean;
}

interface AnimatedCardProps {
  card: Card;
  index: number;
  totalCards: number;
  state: "playable" | "disabled" | "selected";
  onPress: () => void;
  isSelected: boolean;
  layout: "fan" | "linear" | "compact";
}

const AnimatedCard = React.memo(function AnimatedCard({
  card,
  index,
  totalCards,
  state,
  onPress,
  isSelected,
  layout,
}: AnimatedCardProps) {
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);
  const selectedOffset = useSharedValue(0);

  const screenWidth = Dimensions.get("window").width;
  const cardWidth = 100;

  // Calcul selon le layout
  let spacing, rotation, offset;

  switch (layout) {
    case "fan": {
      offset = totalCards > 4 ? 20 : 40;
      const baseSpacing = Math.max(0.5, 0.85 - totalCards * 0.05);
      spacing = cardWidth * baseSpacing * 1.2;
      const centerIndex = (totalCards - 1) / 2;
      const rotationPerCard = (totalCards / 2) * 2;
      rotation = (index - centerIndex) * rotationPerCard;
      break;
    }
    case "linear": {
      offset = 0;
      spacing = cardWidth * 0.8;
      rotation = 0;
      break;
    }
    case "compact": {
      offset = 0;
      spacing = cardWidth * 0.5;
      rotation = 0;
      break;
    }
  }

  const totalWidth = (totalCards - 1) * spacing + cardWidth;
  const startX = (screenWidth - totalWidth) / 2 - offset;
  const cardX = startX + index * spacing;

  React.useEffect(() => {
    translateY.value = withDelay(
      index * 50,
      withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) })
    );
    opacity.value = withDelay(
      index * 50,
      withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) })
    );
  }, [index, opacity, translateY]);

  React.useEffect(() => {
    selectedOffset.value = withTiming(isSelected ? -30 : 0, {
      duration: 200,
      easing: Easing.out(Easing.ease),
    });
  }, [isSelected, selectedOffset]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value + selectedOffset.value },
      { rotate: `${rotation}deg` },
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
      <PlayingCard
        suit={card.suit}
        rank={card.rank}
        state={state}
        onPress={onPress}
        size="xxl"
      />
    </Animated.View>
  );
});

export function CardHand({
  cards,
  isMyTurn,
  onCardSelect,
  onCardDoubleTap,
  selectedCard,
  disabled = false,
}: CardHandProps) {
  const { cardLayout } = useSettings();

  // Store last tap time for double tap detection
  const lastTapRef = React.useRef<{ time: number; cardId: string } | null>(
    null
  );

  const getCardState = (card: Card): "playable" | "disabled" | "selected" => {
    if (disabled || !isMyTurn) {
      return "disabled";
    }

    if (selectedCard && selectedCard.id === card.id) {
      return "selected";
    }

    return card.playable ? "playable" : "disabled";
  };

  const handleCardPress = (card: Card) => {
    if (disabled || !isMyTurn) return;
    if (!card.playable) return;

    // If card is already selected, play it directly
    if (selectedCard && selectedCard.id === card.id) {
      if (onCardDoubleTap) {
        onCardDoubleTap(card);
      }
      return;
    }

    const now = Date.now();
    const cardId = card.id;

    // Check for double tap
    if (
      lastTapRef.current &&
      lastTapRef.current.cardId === cardId &&
      now - lastTapRef.current.time < 300 // 300ms threshold
    ) {
      // Double tap detected!
      if (onCardDoubleTap) {
        onCardDoubleTap(card);
      }
      lastTapRef.current = null; // Reset
    } else {
      // Single tap - select the card
      lastTapRef.current = { time: now, cardId };
      onCardSelect(card);
    }
  };

  return (
    <View style={styles.container}>
      {cards.map((card, index) => (
        <AnimatedCard
          key={card.id}
          card={card}
          index={index}
          totalCards={cards.length}
          state={getCardState(card)}
          onPress={() => handleCardPress(card)}
          isSelected={!!(selectedCard && selectedCard.id === card.id)}
          layout={cardLayout}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    width: "100%",
    height: 160,
  },
  cardWrapper: {
    position: "absolute",
    bottom: -30,
  },
});
