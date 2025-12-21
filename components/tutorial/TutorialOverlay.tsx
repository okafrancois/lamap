import { Button } from "@/components/ui/Button";
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

interface TutorialOverlayProps {
  visible: boolean;
  title: string;
  message: string;
  icon?: string;
  onContinue?: () => void;
  onSkip?: () => void;
  showSkip?: boolean;
  position?: "center" | "bottom";
}

export function TutorialOverlay({
  visible,
  title,
  message,
  icon,
  onContinue,
  onSkip,
  showSkip = false,
  position = "center",
}: TutorialOverlayProps) {
  const colors = useColors();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(
    new Animated.Value(position === "bottom" ? 100 : 0)
  ).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: position === "bottom" ? 100 : 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim, position]);

  if (!visible) return null;

  const styles = StyleSheet.create({
    modal: {
      flex: 1,
      justifyContent: "flex-end",
    },
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    overlay: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      borderWidth: 2,
      borderBottomWidth: 0,
      borderColor: colors.primary,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 16,
    },
    overlayCenter: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 24,
      margin: 24,
      borderWidth: 2,
      borderColor: colors.primary,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 16,
    },
    iconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.accent,
      justifyContent: "center",
      alignItems: "center",
      alignSelf: "center",
      marginBottom: 16,
      borderWidth: 2,
      borderColor: colors.primary,
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
      marginBottom: 12,
    },
    message: {
      fontSize: 16,
      color: colors.mutedForeground,
      textAlign: "center",
      lineHeight: 24,
      marginBottom: 24,
    },
    buttonContainer: {
      gap: 12,
    },
    skipButton: {
      marginTop: 8,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onSkip}
    >
      <View style={styles.modal}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onSkip}
        />
        <Animated.View
          style={[
            position === "bottom" ? styles.overlay : styles.overlayCenter,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: position === "bottom" ? slideAnim : 0,
                },
              ],
            },
          ]}
        >
          {icon && (
            <View style={styles.iconContainer}>
              <IconSymbol name={icon as any} size={32} color={colors.primary} />
            </View>
          )}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttonContainer}>
            {onContinue && (
              <Button
                title="Continuer"
                onPress={onContinue}
                variant="primary"
              />
            )}
            {showSkip && onSkip && (
              <Button
                title="Passer"
                onPress={onSkip}
                variant="ghost"
                style={styles.skipButton}
              />
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
