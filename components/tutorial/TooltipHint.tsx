import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/useColors";
import React from "react";
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface TooltipHintProps {
  visible: boolean;
  message: string;
  position?: "top" | "bottom" | "left" | "right";
  onPress?: () => void;
  icon?: string;
}

export function TooltipHint({
  visible,
  message,
  position = "top",
  onPress,
  icon,
}: TooltipHintProps) {
  const colors = useColors();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim, pulseAnim]);

  if (!visible) return null;

  const styles = StyleSheet.create({
    tooltip: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 12,
      maxWidth: 280,
      borderWidth: 2,
      borderColor: colors.primary,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    tooltipContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    tooltipIcon: {
      width: 24,
      height: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    tooltipText: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
      fontWeight: "500",
      lineHeight: 20,
    },
    pulseContainer: {
      transform: [{ scale: pulseAnim }],
    },
  });

  return (
    <Modal transparent visible={visible} animationType="none">
      <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onPress}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Animated.View
            style={[
              styles.tooltip,
              {
                opacity: fadeAnim,
              },
              styles.pulseContainer,
            ]}
          >
            <TouchableOpacity
              onPress={onPress}
              activeOpacity={0.8}
              style={styles.tooltipContent}
            >
              {icon && (
                <View style={styles.tooltipIcon}>
                  <IconSymbol
                    name={icon as any}
                    size={20}
                    color={colors.primary}
                  />
                </View>
              )}
              <Text style={styles.tooltipText}>{message}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
