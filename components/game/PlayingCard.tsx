import { Colors } from "@/constants/theme";
import { SUIT_COLORS, type Card } from "@/convex/game";
import { Image } from "expo-image";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

interface PlayingCardProps {
  suit: Card["suit"];
  value: number;
  state: "playable" | "disabled" | "selected" | "played";
  onPress?: () => void;
  size?: "small" | "medium" | "large";
}

const CARD_SIZES = {
  small: { width: 60, height: 84 },
  medium: { width: 80, height: 112 },
  large: { width: 100, height: 140 },
};

const SUIT_IMAGES = {
  spade: require("@/assets/images/suit_spade.svg"),
  club: require("@/assets/images/suit_club.svg"),
  heart: require("@/assets/images/suit_heart.svg"),
  diamond: require("@/assets/images/suit_diamond.svg"),
};

export function PlayingCard({
  suit,
  value,
  state,
  onPress,
  size = "medium",
}: PlayingCardProps) {
  const cardSize = CARD_SIZES[size];
  const suitColor = SUIT_COLORS[suit];
  const suitImage = SUIT_IMAGES[suit];
  const isPlayable = state === "playable" || state === "selected";
  const isSelected = state === "selected";

  const suitIconSize =
    size === "small" ? 14
    : size === "medium" ? 18
    : 22;
  const suitIconLargeSize =
    size === "small" ? 36
    : size === "medium" ? 52
    : 68;

  const cardStyle: ViewStyle[] = [
    styles.card,
    {
      width: cardSize.width,
      height: cardSize.height,
      backgroundColor:
        state === "disabled" ?
          `${Colors.primary.blue}99`
        : Colors.derived.white,
      borderColor:
        isSelected ? Colors.primary.gold
        : state === "playable" ? Colors.primary.gold
        : Colors.primary.blue,
      borderWidth: isSelected ? 3 : 2,
      transform: [{ scale: isSelected ? 1.05 : 1 }],
      shadowColor: isSelected ? Colors.primary.gold : Colors.derived.black,
      shadowOffset: { width: 0, height: isSelected ? 4 : 2 },
      shadowOpacity: isSelected ? 0.5 : 0.2,
      shadowRadius: isSelected ? 8 : 4,
      opacity: state === "disabled" ? 0.6 : 1,
    },
  ];

  const content = (
    <View style={cardStyle}>
      <View style={styles.topCorner}>
        <Text style={[styles.value, { color: suitColor }]}>{value}</Text>
        <Image
          source={suitImage}
          style={[
            styles.suitIcon,
            {
              width: suitIconSize,
              height: suitIconSize,
            },
          ]}
          contentFit="contain"
        />
      </View>

      <View style={styles.center}>
        <Image
          source={suitImage}
          style={[
            styles.suitIconLarge,
            {
              width: suitIconLargeSize,
              height: suitIconLargeSize,
            },
          ]}
          contentFit="contain"
        />
      </View>

      <View style={styles.bottomCorner}>
        <Image
          source={suitImage}
          style={[
            styles.suitIcon,
            {
              width: suitIconSize,
              height: suitIconSize,
              transform: [{ rotate: "180deg" }],
            },
          ]}
          contentFit="contain"
        />
        <Text
          style={[
            styles.value,
            { color: suitColor, transform: [{ rotate: "180deg" }] },
          ]}
        >
          {value}
        </Text>
      </View>
    </View>
  );

  if (state === "played" || !onPress || !isPlayable) {
    return content;
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      disabled={!isPlayable}
    >
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 8,
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 4,
  },
  topCorner: {
    alignSelf: "flex-start",
    alignItems: "center",
  },
  bottomCorner: {
    alignSelf: "flex-end",
    alignItems: "center",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  value: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
  },
  suitIcon: {
    marginTop: 2,
  },
  suitIconLarge: {
    marginVertical: 4,
  },
});
