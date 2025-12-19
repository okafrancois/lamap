import { Colors } from "@/constants/theme";
import React, { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface ConfirmPlayButtonProps {
  visible: boolean;
  onPress: () => void;
  disabled?: boolean;
}

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

export function ConfirmPlayButton({
  visible,
  onPress,
  disabled = false,
}: ConfirmPlayButtonProps) {
  const translateY = useSharedValue(visible ? 0 : 20);
  const opacity = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 400 });
      opacity.value = withTiming(1, { duration: 400 });
    } else {
      translateY.value = withTiming(20, { duration: 400 });
      opacity.value = withTiming(0, { duration: 400 });
    }
  }, [visible, translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const styles = StyleSheet.create({
    button: {
      paddingHorizontal: 28,
      paddingVertical: 12,
      borderRadius: 24,
      backgroundColor: Colors.gameUI.orClair,
      shadowColor: Colors.gameUI.orSable,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.5,
      shadowRadius: 16,
      elevation: 8,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    text: {
      fontSize: 13,
      fontWeight: "700",
      letterSpacing: 0.8,
      color: Colors.derived.black,
      textAlign: "center",
    },
  });

  if (!visible) return null;

  return (
    <AnimatedTouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled, animatedStyle]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={styles.text}>Jouer cette carte</Text>
    </AnimatedTouchableOpacity>
  );
}
