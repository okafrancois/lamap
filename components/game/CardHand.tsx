import { isValidPlay, type Card } from '@/convex/game';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import { PlayingCard } from './PlayingCard';

interface CardHandProps {
  cards: Card[];
  leadSuit: string | null;
  isMyTurn: boolean;
  onCardSelect: (card: Card) => void;
  selectedCard?: Card | null;
  disabled?: boolean;
}

interface AnimatedCardProps {
  card: Card;
  index: number;
  state: 'playable' | 'disabled' | 'selected';
  onPress: () => void;
  isSelected: boolean;
}

function AnimatedCard({ card, index, state, onPress, isSelected }: AnimatedCardProps) {
  const translateY = useSharedValue(50);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    translateY.value = withDelay(index * 50, withSpring(0, { damping: 15 }));
    opacity.value = withDelay(index * 50, withSpring(1, { damping: 15 }));
  }, []);

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
        value={card.value}
        state={state}
        onPress={onPress}
        size="medium"
      />
    </Animated.View>
  );
}

export function CardHand({
  cards,
  leadSuit,
  isMyTurn,
  onCardSelect,
  selectedCard,
  disabled = false,
}: CardHandProps) {
  const getCardState = (card: Card): 'playable' | 'disabled' | 'selected' => {
    if (disabled || !isMyTurn) {
      return 'disabled';
    }

    if (selectedCard && selectedCard.suit === card.suit && selectedCard.value === card.value) {
      return 'selected';
    }

    const canPlay = isValidPlay(cards, card, leadSuit);
    return canPlay ? 'playable' : 'disabled';
  };

  const handleCardPress = (card: Card) => {
    if (disabled || !isMyTurn) return;
    const canPlay = isValidPlay(cards, card, leadSuit);
    if (canPlay) {
      onCardSelect(card);
    }
  };

  return (
    <View style={styles.container}>
      {cards.map((card, index) => (
        <AnimatedCard
          key={`${card.suit}-${card.value}-${index}`}
          card={card}
          index={index}
          state={getCardState(card)}
          onPress={() => handleCardPress(card)}
          isSelected={!!(selectedCard && selectedCard.suit === card.suit && selectedCard.value === card.value)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
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

