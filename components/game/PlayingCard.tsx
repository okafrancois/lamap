import { Colors } from "@/constants/theme";
import { Image } from "expo-image";
import React, { useEffect } from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming,
} from "react-native-reanimated";

type Suit = "hearts" | "diamonds" | "clubs" | "spades";
type Rank = "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10";

interface PlayingCardProps {
  suit: Suit;
  rank: Rank;
  state: "playable" | "disabled" | "selected" | "played";
  onPress?: () => void;
  size?: "small" | "medium" | "large";
}

const CARD_SIZES = {
  small: { width: 60, height: 84 },
  medium: { width: 80, height: 112 },
  large: { width: 100, height: 140 },
};

const SUIT_COLORS: Record<Suit, string> = {
  spades: "#1A1A1A",
  clubs: "#1A1A1A",
  hearts: "#B4443E",
  diamonds: "#B4443E",
};

const SUIT_IMAGES: Record<Suit, any> = {
  spades: require("@/assets/images/suit_spade.svg"),
  clubs: require("@/assets/images/suit_club.svg"),
  hearts: require("@/assets/images/suit_heart.svg"),
  diamonds: require("@/assets/images/suit_diamond.svg"),
};

export function PlayingCard({
  suit,
  rank,
  state,
  onPress,
  size = "medium",
}: PlayingCardProps) {
  const cardSize = CARD_SIZES[size];
  const suitColor = SUIT_COLORS[suit];
  const suitImage = SUIT_IMAGES[suit];
  const displayValue = rank;
  const isPlayable = state === "playable" || state === "selected";
  const isSelected = state === "selected";
  const isPlayed = state === "played";

  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);
  const rotateY = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 300 });
    translateY.value = withSpring(0, { damping: 15 });
  }, [opacity, translateY]);

  useEffect(() => {
    if (isSelected) {
      scale.value = withSpring(1.05, { damping: 10 });
    } else {
      scale.value = withSpring(1, { damping: 10 });
    }
  }, [isSelected, scale]);

  useEffect(() => {
    if (isPlayed) {
      rotateY.value = withSequence(
        withTiming(90, { duration: 200 }),
        withTiming(0, { duration: 200 })
      );
    }
  }, [isPlayed, rotateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
      { rotateY: `${rotateY.value}deg` },
    ],
    opacity: opacity.value,
  }));

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
          "#D1D1D1" // Subtle gray for disabled
        : Colors.derived.white,
      borderColor:
        isSelected ? Colors.primary.gold
        : state === "playable" ? Colors.primary.gold
        : state === "disabled" ? "#A0A0A0" // Gray border for disabled
        : Colors.primary.blue,
      borderWidth: isSelected ? 3 : 2,
      shadowColor: isSelected ? Colors.primary.gold : Colors.derived.black,
      shadowOffset: { width: 0, height: isSelected ? 4 : 2 },
      shadowOpacity: isSelected ? 0.5 : 0.2,
      shadowRadius: isSelected ? 8 : 4,
      opacity: 1, // Keep full opacity to avoid transparency
    },
  ];

  const content = (
    <Animated.View style={[cardStyle, animatedStyle]}>
      <View style={styles.topCorner}>
        <Text style={[styles.value, { color: suitColor }]}>{displayValue}</Text>
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
          {displayValue}
        </Text>
      </View>
    </Animated.View>
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
