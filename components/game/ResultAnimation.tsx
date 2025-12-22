import { VictoryType } from "@/convex/validators";
import React, { useEffect, useMemo } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ParticleProps {
  index: number;
  color: string;
  victoryType: VictoryType;
}

function Particle({ index, color, victoryType }: ParticleProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);
  const rotate = useSharedValue(0);

  const particleSize = useMemo(() => {
    if (victoryType === "triple_kora") return 16 + Math.random() * 12;
    if (victoryType === "double_kora") return 12 + Math.random() * 8;
    if (victoryType === "simple_kora") return 8 + Math.random() * 6;
    if (victoryType === "auto_sum") return 4 + Math.random() * 3;
    if (victoryType === "auto_sevens") return 4 + Math.random() * 3;
    return 8 + Math.random() * 6;
  }, [victoryType]);

  const startX = useMemo(() => SCREEN_WIDTH / 2, []);
  const startY = useMemo(() => SCREEN_HEIGHT / 2, []);

  const endX = useMemo(() => (Math.random() - 0.5) * SCREEN_WIDTH * 1.5, []);
  const endY = useMemo(() => (Math.random() - 0.8) * SCREEN_HEIGHT * 1.2, []);

  const animationDelay = useMemo(() => Math.random() * 300, []);

  useEffect(() => {
    opacity.value = withDelay(
      animationDelay,
      withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(
          1500,
          withTiming(0, { duration: 800, easing: Easing.out(Easing.ease) })
        )
      )
    );

    scale.value = withDelay(
      animationDelay,
      withSpring(1, {
        damping: 8,
        stiffness: 100,
      })
    );

    translateX.value = withDelay(
      animationDelay,
      withTiming(endX, {
        duration: 2500,
        easing: Easing.out(Easing.cubic),
      })
    );

    translateY.value = withDelay(
      animationDelay,
      withSequence(
        withTiming(endY * 0.6, {
          duration: 800,
          easing: Easing.out(Easing.quad),
        }),
        withTiming(endY, {
          duration: 1700,
          easing: Easing.in(Easing.quad),
        })
      )
    );

    rotate.value = withDelay(
      animationDelay,
      withRepeat(
        withTiming(360, {
          duration: 2000,
          easing: Easing.linear,
        }),
        1,
        false
      )
    );
  }, [
    animationDelay,
    translateX,
    translateY,
    opacity,
    scale,
    rotate,
    endX,
    endY,
  ]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: startX + translateX.value },
      { translateY: startY + translateY.value },
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        animatedStyle,
        {
          backgroundColor: color,
          width: particleSize,
          height: particleSize,
          borderRadius: particleSize / 2,
        },
      ]}
    />
  );
}

interface ResultAnimationProps {
  visible: boolean;
  victoryType: VictoryType;
  isWinner: boolean;
}

export function ResultAnimation({
  visible,
  victoryType,
  isWinner,
}: ResultAnimationProps) {
  const particleCount = useMemo(() => {
    if (victoryType === "triple_kora") return 60;
    if (victoryType === "double_kora") return 40;
    if (victoryType === "simple_kora") return 25;
    if (victoryType === "auto_sum" || victoryType === "auto_sevens") return 25;
    return 0;
  }, [victoryType]);

  const particleColors = useMemo(() => {
    if (victoryType === "triple_kora") {
      return ["#FFD700", "#FFA500", "#FF8C00", "#FFE55C", "#FFC700"];
    }
    if (victoryType === "double_kora") {
      return ["#A68258", "#C9A56B", "#8B6F47", "#D4AF7A"];
    }
    if (victoryType === "simple_kora") {
      return ["#A3D977", "#8BC34A", "#7CB342", "#CDDC39"];
    }
    return ["#A3D977", "#8BC34A", "#7CB342", "#CDDC39"];
  }, [victoryType]);

  if (!visible || !isWinner || particleCount === 0) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {Array.from({ length: particleCount }).map((_, index) => (
        <Particle
          key={index}
          index={index}
          color={particleColors[index % particleColors.length]}
          victoryType={victoryType}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  particle: {
    position: "absolute",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});
