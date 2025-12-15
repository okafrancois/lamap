import React, { useState } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { PlayingCard } from './PlayingCard';
import { type Card } from '@/convex/game';
import { isValidPlay } from '@/convex/game';

interface CardHandProps {
  cards: Card[];
  leadSuit: string | null;
  isMyTurn: boolean;
  onCardSelect: (card: Card) => void;
  selectedCard?: Card | null;
  disabled?: boolean;
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
        <View
          key={`${card.suit}-${card.value}-${index}`}
          style={[
            styles.cardWrapper,
            selectedCard && selectedCard.suit === card.suit && selectedCard.value === card.value && styles.selectedWrapper,
          ]}
        >
          <PlayingCard
            suit={card.suit}
            value={card.value}
            state={getCardState(card)}
            onPress={() => handleCardPress(card)}
            size="medium"
          />
        </View>
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

