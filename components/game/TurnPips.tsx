import { Colors } from "@/constants/theme";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

interface TurnPipsProps {
  totalRounds: number;
  currentRound: number;
  roundsWonByPlayer: number;
  roundsWonByOpponent: number;
}

export function TurnPips({
  totalRounds,
  currentRound,
  roundsWonByPlayer,
  roundsWonByOpponent,
}: TurnPipsProps) {
  const pips = Array.from({ length: totalRounds }, (_, i) => {
    const roundNumber = i + 1;
    let state: "empty" | "player" | "opponent" | "current" = "empty";

    if (roundNumber < currentRound) {
      const completedRounds = roundNumber;
      if (completedRounds <= roundsWonByPlayer) {
        state = "player";
      } else if (completedRounds <= roundsWonByPlayer + roundsWonByOpponent) {
        state = "opponent";
      }
    } else if (roundNumber === currentRound) {
      state = "current";
    }

    return { roundNumber, state };
  });

  const styles = StyleSheet.create({
    container: {
      flexDirection: "column",
      gap: 6,
    },
    label: {
      fontSize: 9,
      fontWeight: "600",
      letterSpacing: 1.5,
      textTransform: "uppercase",
      color: Colors.gameUI.orClair,
      opacity: 0.9,
    },
    pipsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Manche</Text>
      <View style={styles.pipsRow}>
        {pips.map((pip) => (
          <TurnPip key={pip.roundNumber} state={pip.state} />
        ))}
      </View>
    </View>
  );
}

function TurnPip({
  state,
}: {
  state: "empty" | "player" | "opponent" | "current";
}) {
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    if (state === "current") {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        false
      );
    }
  }, [state, pulseOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: state === "current" ? pulseOpacity.value : 1,
  }));

  const styles = StyleSheet.create({
    pip: {
      width: 10,
      height: 10,
      borderRadius: 10,
      overflow: "hidden",
      backgroundColor:
        state === "opponent" ?
          Colors.gameUI.rougeSombre
        : Colors.gameUI.bleuProfond,
      borderWidth: 1,
      borderColor:
        state === "current" ? Colors.gameUI.orClair
        : state === "opponent" ? Colors.gameUI.rougeTerre
        : `rgba(166, 130, 88, 0.35)`,
    },
    fill: {
      position: "absolute",
      top: 0,
      left: 0,
      bottom: 0,
      width: "100%",
      backgroundColor:
        state === "player" ? Colors.gameUI.orClair
        : state === "opponent" ? Colors.gameUI.rougeVif
        : "transparent",
      borderRadius: 10,
    },
  });

  return (
    <Animated.View style={[styles.pip, animatedStyle]}>
      {(state === "player" || state === "opponent") && (
        <View style={styles.fill} />
      )}
    </Animated.View>
  );
}
