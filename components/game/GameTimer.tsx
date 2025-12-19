import { useColors } from "@/hooks/useColors";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
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
}

export function GameTimer({
  timeRemaining,
  totalTime,
  isMyTurn,
  isActive,
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
    if (!isActive) return;

    const interval = setInterval(() => {
      setLocalTime((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

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

  const getBackgroundColor = () => {
    if (isCriticalTime) return "rgba(239, 68, 68, 0.1)";
    if (isLowTime) return "rgba(245, 158, 11, 0.1)";
    return isMyTurn ? "rgba(166, 130, 88, 0.15)" : "rgba(255, 255, 255, 0.05)";
  };

  if (!isActive) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        animatedStyle,
        { backgroundColor: getBackgroundColor() },
      ]}
    >
      <Ionicons
        name={isCriticalTime ? "warning" : "time-outline"}
        size={16}
        color={getTimerColor()}
      />
      <Text style={[styles.time, { color: getTimerColor() }]}>
        {formatTime(localTime)}
      </Text>
      {isMyTurn && (
        <View
          style={[
            styles.indicator,
            {
              backgroundColor: getTimerColor(),
            },
          ]}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  time: {
    fontSize: 14,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
