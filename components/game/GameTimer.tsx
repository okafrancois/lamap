import { useColors } from "@/hooks/useColors";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
} from "react-native-reanimated";

interface GameTimerProps {
  timeRemaining: number;
  totalTime: number;
  isMyTurn: boolean;
  isActive: boolean;
  isOpponentTimer: boolean;
}

export function GameTimer({
  timeRemaining,
  totalTime,
  isMyTurn,
  isActive,
  isOpponentTimer,
}: GameTimerProps) {
  const colors = useColors();
  const [localTime, setLocalTime] = useState(timeRemaining);

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const percentage = (timeRemaining / totalTime) * 100;
  const isLowTime = percentage < 20;
  const isCriticalTime = percentage < 10;

  useEffect(() => {
    setLocalTime(timeRemaining);
  }, [timeRemaining]);

  useEffect(() => {
    if (!isActive || !isMyTurn) return;

    const interval = setInterval(() => {
      setLocalTime((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, isMyTurn]);

  useEffect(() => {
    if (isCriticalTime && isMyTurn && isActive) {
      scale.value = withRepeat(
        withSpring(1.15, { damping: 10, stiffness: 200 }),
        -1,
        true
      );
    } else if (isLowTime && isMyTurn && isActive) {
      scale.value = withRepeat(
        withSpring(1.08, { damping: 12, stiffness: 150 }),
        -1,
        true
      );
    } else {
      scale.value = withSpring(1);
    }
  }, [isLowTime, isCriticalTime, isMyTurn, isActive, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimerColor = () => {
    if (isCriticalTime) return "#EF4444";
    if (isLowTime) return "#F59E0B";
    return isMyTurn ? colors.primary : colors.mutedForeground;
  };

  if (!isActive) {
    return null;
  }
  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      gap: isOpponentTimer ? 2 : 6,
    },
    time: {
      fontSize: isOpponentTimer ? 12 : 14,
      color: getTimerColor(),
      fontWeight: "700",
      fontVariant: ["tabular-nums"],
    },
  });

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Ionicons
        name={isCriticalTime ? "warning" : "time-outline"}
        size={isOpponentTimer ? 12 : 16}
        color={getTimerColor()}
      />
      <Text style={styles.time}>{formatTime(localTime)}</Text>
    </Animated.View>
  );
}
