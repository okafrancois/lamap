import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
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
  state: "playable" | "disabled" | "selected";
  onPress: () => void;
  isSelected: boolean;
}

const AnimatedCard = React.memo(function AnimatedCard({
  card,
  index,
  state,
  onPress,
  isSelected,
}: AnimatedCardProps) {
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    translateY.value = withDelay(index * 30, withTiming(0, { duration: 200 }));
    opacity.value = withDelay(index * 30, withTiming(1, { duration: 200 }));
  }, [index, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        animatedStyle,
        isSelected && styles.selectedWrapper,
      ]}
    >
      <PlayingCard
        suit={card.suit}
        rank={card.rank}
        state={state}
        onPress={onPress}
        size="medium"
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
          state={getCardState(card)}
          onPress={() => handleCardPress(card)}
          isSelected={!!(selectedCard && selectedCard.id === card.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  cardWrapper: {
    marginHorizontal: -8,
  },
  selectedWrapper: {
    marginBottom: 16,
  },
});
