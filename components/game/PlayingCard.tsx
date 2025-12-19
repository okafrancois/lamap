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
  withRepeat,
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
  size?: "small" | "medium" | "large" | "xl" | "xxl";
}

const CARD_ASPECT_RATIO = 5 / 7;

const CARD_WIDTHS = {
  small: 60,
  medium: 80,
  large: 100,
  xl: 120,
  xxl: 140,
};

const SMALL_ICON_RATIO = 0.225;
const LARGE_ICON_RATIO = 0.65;

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
  const cardWidth = CARD_WIDTHS[size];
  const cardHeight = cardWidth / CARD_ASPECT_RATIO;
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
  const pulseOpacity = useSharedValue(1);

  const styles = StyleSheet.create({
    card: {
      borderRadius: cardWidth * 0.1,
      padding: cardWidth * 0.05,
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
      fontSize: cardWidth * 0.12,
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
      pulseOpacity.value = 1;
    } else if (state === "playable") {
      // Pulsation subtile pour les cartes jouables
      scale.value = withRepeat(
        withSpring(1.02, {
          damping: 15,
          stiffness: 150,
        }),
        -1,
        true
      );
      pulseOpacity.value = withRepeat(
        withTiming(0.95, {
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
    } else {
      scale.value = withTiming(1, {
        duration: AnimationDurations.fast,
        easing: Easing.out(Easing.ease),
      });
      pulseOpacity.value = 1;
    }
  }, [isSelected, state, scale, pulseOpacity]);

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
    opacity: opacity.value * pulseOpacity.value,
  }));

  const suitIconSize = Math.round(cardWidth * SMALL_ICON_RATIO);
  const suitIconLargeSize = Math.round(cardWidth * LARGE_ICON_RATIO);

  const cardStyle: ViewStyle[] = [
    styles.card,
    {
      width: cardWidth,
      height: cardHeight,
      backgroundColor:
        state === "disabled" ?
          colors.playingCardDisabledBackground
        : colors.playingCardBackground,
      borderColor:
        isSelected ? colors.secondary
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
