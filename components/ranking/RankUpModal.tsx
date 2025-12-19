import { Button } from "@/components/ui/Button";
import { RankInfo } from "@/convex/ranking";
import { useColors } from "@/hooks/useColors";
import React, { useEffect } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { RankBadge } from "./RankBadge";

interface RankUpModalProps {
  visible: boolean;
  newRank: RankInfo;
  koraReward: number;
  newPR: number;
  onClose: () => void;
}

export function RankUpModal({
  visible,
  newRank,
  koraReward,
  newPR,
  onClose,
}: RankUpModalProps) {
  const colors = useColors();

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const badgeScale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
      });

      badgeScale.value = withDelay(
        500,
        withRepeat(withTiming(1.1, { duration: 600 }), -1, true)
      );
    } else {
      opacity.value = 0;
      scale.value = 0;
      badgeScale.value = 1;
    }
  }, [visible]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const badgeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        style={[
          styles.overlay,
          { backgroundColor: "rgba(0, 0, 0, 0.8)" },
          containerAnimatedStyle,
        ]}
      >
        <Animated.View
          style={[
            styles.content,
            { backgroundColor: colors.card },
            contentAnimatedStyle,
          ]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: newRank.color }]}>
              🎉 MONTÉE DE RANG ! 🎉
            </Text>
            <Text style={[styles.subtitle, { color: colors.text }]}>
              Félicitations !
            </Text>
          </View>

          <Animated.View style={[styles.badgeContainer, badgeAnimatedStyle]}>
            <RankBadge rank={newRank} size="large" showName showPR pr={newPR} />
          </Animated.View>

          {koraReward > 0 && (
            <View
              style={[
                styles.rewardContainer,
                { backgroundColor: colors.muted },
              ]}
            >
              <Text style={[styles.rewardTitle, { color: colors.text }]}>
                Récompense de rang
              </Text>
              <Text style={[styles.rewardAmount, { color: "#A68258" }]}>
                +{koraReward} ⭐ Kora
              </Text>
            </View>
          )}

          <Text style={[styles.message, { color: colors.mutedForeground }]}>
            Vous avez atteint le rang{" "}
            <Text style={{ color: newRank.color, fontWeight: "700" }}>
              {newRank.name}
            </Text>{" "}
            ! Continuez à jouer pour progresser encore plus haut.
          </Text>

          <Button
            title="Continuer"
            onPress={onClose}
            variant="primary"
            size="lg"
          />
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  content: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    gap: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  badgeContainer: {
    alignItems: "center",
    paddingVertical: 16,
  },
  rewardContainer: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    gap: 8,
  },
  rewardTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  rewardAmount: {
    fontSize: 28,
    fontWeight: "800",
  },
  message: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
