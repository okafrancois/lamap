import { AnimationDurations } from "@/constants/animations";
import { Spacing } from "@/constants/spacing";
import { useColors } from "@/hooks/useColors";
import { getCardShadow, getPlayableCardShadow } from "@/utils/shadows";
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
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
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

// Dimensions selon le guide de style (uniformes pour joueur et adversaire)
const CARD_SIZES = {
  small: { width: 60, height: 84 }, // 60px × 84px
  medium: { width: 80, height: 112 }, // 80px × 112px
  large: { width: 100, height: 140 }, // 100px × 140px
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

export const PlayingCard = React.memo(function PlayingCard({
  suit,
  rank,
  state,
  onPress,
  size = "medium",
}: PlayingCardProps) {
  const colors = useColors();
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
    opacity.value = withTiming(1, {
      duration: AnimationDurations.fast,
      easing: Easing.out(Easing.ease),
    });
    translateY.value = withTiming(0, {
      duration: AnimationDurations.fast,
      easing: Easing.out(Easing.ease),
    });
  }, [opacity, translateY]);

  useEffect(() => {
    if (isSelected) {
      scale.value = withTiming(1.05, {
        duration: AnimationDurations.fast,
        easing: Easing.out(Easing.ease),
      });
    } else {
      scale.value = withTiming(1, {
        duration: AnimationDurations.fast,
        easing: Easing.out(Easing.ease),
      });
    }
  }, [isSelected, scale]);

  useEffect(() => {
    if (isPlayed) {
      rotateY.value = withSequence(
        withTiming(90, { duration: 100 }),
        withTiming(0, { duration: 100 })
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
      backgroundColor: state === "disabled" ? colors.muted : colors.card,
      borderColor:
        isSelected ? colors.primary
        : state === "playable" ? colors.primary
        : state === "disabled" ? colors.border
        : colors.border,
      borderWidth: isSelected ? 3 : 2,
      borderRadius: Spacing.radius.lg, // rounded-lg (8px)
      ...(state === "playable" && !isSelected ?
        getPlayableCardShadow(colors.primary)
      : isSelected ? getCardShadow(colors.primary)
      : getCardShadow()),
      opacity: 1,
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
      accessibilityLabel={`Carte ${rank} de ${suit}`}
      accessibilityHint={
        isPlayable ? "Double-tapez pour jouer cette carte" : "Carte non jouable"
      }
      accessibilityRole="button"
    >
      {content}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.radius.lg,
    padding: 8,
    justifyContent: "space-between",
    alignItems: "center",
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
