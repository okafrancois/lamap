import { useColors } from "@/hooks/useColors";
import { CardLayout } from "@/hooks/useSettings";
import React from "react";
import { StyleSheet, View } from "react-native";

interface CardLayoutPreviewProps {
  layout: CardLayout;
  isSelected?: boolean;
}

export function CardLayoutPreview({
  layout,
  isSelected = false,
}: CardLayoutPreviewProps) {
  const colors = useColors();

  const getCardPositions = () => {
    const cards = 4;
    const cardWidth = 20;
    const cardHeight = 28;

    switch (layout) {
      case "fan": {
        const positions = [];
        const spacing = cardWidth * 0.7;
        const totalWidth = (cards - 1) * spacing + cardWidth;
        const startX = (80 - totalWidth) / 2;
        const centerIndex = (cards - 1) / 2;
        const rotationPerCard = 5;

        for (let i = 0; i < cards; i++) {
          const rotation = (i - centerIndex) * rotationPerCard;
          positions.push({
            left: startX + i * spacing,
            rotation: `${rotation}deg`,
          });
        }
        return positions;
      }

      case "linear": {
        const positions = [];
        const spacing = cardWidth * 0.8;
        const totalWidth = (cards - 1) * spacing + cardWidth;
        const startX = (80 - totalWidth) / 2;

        for (let i = 0; i < cards; i++) {
          positions.push({
            left: startX + i * spacing,
            rotation: "0deg",
          });
        }
        return positions;
      }

      case "compact": {
        const positions = [];
        const spacing = cardWidth * 0.5;
        const totalWidth = (cards - 1) * spacing + cardWidth;
        const startX = (80 - totalWidth) / 2;

        for (let i = 0; i < cards; i++) {
          positions.push({
            left: startX + i * spacing,
            rotation: "0deg",
          });
        }
        return positions;
      }
    }
  };

  const cardPositions = getCardPositions();

  const styles = StyleSheet.create({
    container: {
      width: 80,
      height: 50,
      backgroundColor: isSelected ? colors.accent : colors.muted,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: isSelected ? colors.primary : "transparent",
      position: "relative",
      overflow: "visible",
    },
    card: {
      position: "absolute",
      width: 20,
      height: 28,
      backgroundColor: colors.playingCardBackground,
      borderRadius: 2,
      borderWidth: 1,
      borderColor: colors.border,
      bottom: 10,
    },
  });

  return (
    <View style={styles.container}>
      {cardPositions.map((pos, index) => (
        <View
          key={index}
          style={[
            styles.card,
            {
              left: pos.left,
              transform: [{ rotate: pos.rotation }],
            },
          ]}
        />
      ))}
    </View>
  );
}

