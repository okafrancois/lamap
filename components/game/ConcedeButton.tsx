import { Button } from "@/components/ui/Button";
import { useColors } from "@/hooks/useColors";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

interface ConcedeButtonProps {
  onConcede: () => void;
  disabled?: boolean;
}

export function ConcedeButton({ onConcede, disabled }: ConcedeButtonProps) {
  const colors = useColors();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const scale = useSharedValue(1);

  const handlePress = () => {
    scale.value = withSpring(0.95, { damping: 10 }, () => {
      scale.value = withSpring(1);
    });
    setConfirmVisible(true);
  };

  const handleConfirm = () => {
    setConfirmVisible(false);
    onConcede();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <>
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              borderColor: "rgba(239, 68, 68, 0.3)",
            },
            disabled && styles.disabled,
          ]}
          onPress={handlePress}
          disabled={disabled}
        >
          <Ionicons name="flag" size={16} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.background },
            ]}
          >
            <Ionicons name="warning" size={48} color="#F59E0B" />
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Abandonner la partie ?
            </Text>
            <Text
              style={[
                styles.modalDescription,
                { color: colors.mutedForeground },
              ]}
            >
              Vous allez perdre cette partie et votre mise. Cette action est
              irréversible.
            </Text>

            <View style={styles.modalActions}>
              <Button
                title="Annuler"
                onPress={() => setConfirmVisible(false)}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="Abandonner"
                onPress={handleConfirm}
                variant="destructive"
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  modalDescription: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalButton: {
    flex: 1,
  },
});
