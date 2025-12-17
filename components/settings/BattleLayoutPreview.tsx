import { useColors } from "@/hooks/useColors";
import { BattleLayout } from "@/hooks/useSettings";
import React from "react";
import { StyleSheet, View } from "react-native";

interface BattleLayoutPreviewProps {
  layout: BattleLayout;
  isSelected?: boolean;
}

export function BattleLayoutPreview({
  layout,
  isSelected = false,
}: BattleLayoutPreviewProps) {
  const colors = useColors();

  const styles = StyleSheet.create({
    container: {
      width: 80,
      height: 50,
      backgroundColor: isSelected ? colors.accent : colors.muted,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: isSelected ? colors.primary : "transparent",
      position: "relative",
      overflow: "visible",
      justifyContent: "center",
      alignItems: "center",
    },
    verticalLayout: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    horizontalLayout: {
      flexDirection: "column",
      alignItems: "center",
      gap: 4,
    },
    playerStack: {
      position: "relative",
    },
    card: {
      width: 14,
      height: 20,
      backgroundColor: colors.playingCardBackground,
      borderRadius: 2,
      borderWidth: 1,
      borderColor: colors.border,
      position: "absolute",
    },
    vs: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.secondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
  });

  const renderVerticalStacks = () => (
    <View style={styles.verticalLayout}>
      {/* Stack adversaire (gauche) */}
      <View style={[styles.playerStack, { height: 24 }]}>
        <View style={[styles.card, { top: 0 }]} />
        <View style={[styles.card, { top: 4 }]} />
      </View>

      {/* VS */}
      <View style={styles.vs} />

      {/* Stack joueur (droite) */}
      <View style={[styles.playerStack, { height: 24 }]}>
        <View style={[styles.card, { top: 0 }]} />
        <View style={[styles.card, { top: 4 }]} />
      </View>
    </View>
  );

  const renderHorizontalStacks = () => (
    <View style={styles.horizontalLayout}>
      {/* Stack adversaire (haut) */}
      <View style={[styles.playerStack, { width: 24, height: 20 }]}>
        <View style={[styles.card, { left: 0 }]} />
        <View style={[styles.card, { left: 5 }]} />
      </View>

      {/* VS */}
      <View style={styles.vs} />

      {/* Stack joueur (bas) */}
      <View style={[styles.playerStack, { width: 24, height: 20 }]}>
        <View style={[styles.card, { left: 0 }]} />
        <View style={[styles.card, { left: 5 }]} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {layout === "vertical" ?
        renderVerticalStacks()
      : renderHorizontalStacks()}
    </View>
  );
}
