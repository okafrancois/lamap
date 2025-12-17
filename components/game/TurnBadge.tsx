import { Colors } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import React, { useEffect } from "react";
import { StyleSheet, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

interface TurnBadgeProps {
  visible: boolean;
}

export function TurnBadge({ visible }: TurnBadgeProps) {
  const colors = useColors();
  const isDark = colors.background === Colors.dark.background;

  const glowIntensity = useSharedValue(0.3);
  const scale = useSharedValue(visible ? 1 : 0.95);
  const opacity = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    if (visible) {
      scale.value = withTiming(1, { duration: 300 });
      opacity.value = withTiming(1, { duration: 300 });
      glowIntensity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 1200 }),
          withTiming(0.6, { duration: 1200 })
        ),
        -1,
        false
      );
    } else {
      scale.value = withTiming(0.95, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [visible, scale, opacity, glowIntensity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const styles = StyleSheet.create({
    badge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 18,
      paddingVertical: 8,
      borderRadius: 18,
      backgroundColor:
        isDark ? Colors.gameUI.rougeTerre : Colors.gameUI.rougeSombre,
      borderWidth: 1,
      borderColor: colors.secondary,
      shadowColor: Colors.gameUI.rougeTerre,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 8,
    },
    icon: {
      fontSize: 14,
    },
    text: {
      fontSize: 12,
      fontWeight: "600",
      letterSpacing: 0.4,
      color: Colors.derived.white,
    },
  });

  if (!visible) return null;

  return (
    <Animated.View style={[styles.badge, animatedStyle]}>
      <Text style={styles.icon}>⚔️</Text>
      <Text style={styles.text}>À vous de jouer</Text>
    </Animated.View>
  );
}
