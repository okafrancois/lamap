import { Suit } from "@/convex/validators";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";

interface DemandedSuitIndicatorProps {
  suit: Suit;
  visible: boolean;
}

const SUIT_IMAGES: Record<Suit, any> = {
  spades: require("@/assets/images/suit_spade.svg"),
  clubs: require("@/assets/images/suit_club.svg"),
  hearts: require("@/assets/images/suit_heart.svg"),
  diamonds: require("@/assets/images/suit_diamond.svg"),
};

const SUIT_NAMES: Record<Suit, string> = {
  spades: "Pique",
  clubs: "Trèfle",
  hearts: "Cœur",
  diamonds: "Carreau",
};

const SUIT_COLORS: Record<Suit, string[]> = {
  spades: ["#1A1A1A", "#2A2A2A"],
  clubs: ["#1A1A1A", "#2A2A2A"],
  hearts: ["#B4443E", "#D35750"],
  diamonds: ["#B4443E", "#D35750"],
};

export function DemandedSuitIndicator({
  suit,
  visible,
}: DemandedSuitIndicatorProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 200,
      });
      opacity.value = withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
      pulseScale.value = withRepeat(
        withSpring(1.08, {
          damping: 12,
          stiffness: 150,
        }),
        -1,
        true
      );
    } else {
      scale.value = withTiming(0, {
        duration: 250,
        easing: Easing.in(Easing.ease),
      });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible, scale, opacity, pulseScale]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, animatedContainerStyle]}>
      <LinearGradient
        colors={SUIT_COLORS[suit]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Text style={styles.label}>Couleur demandée</Text>
          <Animated.View style={[styles.iconContainer, animatedPulseStyle]}>
            <Image
              source={SUIT_IMAGES[suit]}
              style={styles.icon}
              contentFit="contain"
            />
          </Animated.View>
          <Text style={styles.suitName}>{SUIT_NAMES[suit]}</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gradient: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    gap: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.85)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    width: 28,
    height: 28,
  },
  suitName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
