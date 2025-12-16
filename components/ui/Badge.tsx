import { Spacing } from "@/constants/spacing";
import { Typography } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";
import React from "react";
import { Text, TextStyle, View, ViewStyle } from "react-native";

interface BadgeProps {
  label: string;
  variant?: "kora" | "default" | "success" | "warning";
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Badge({
  label,
  variant = "default",
  style,
  textStyle,
}: BadgeProps) {
  const colors = useColors();
  const getBadgeStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      paddingVertical: 2,
      paddingHorizontal: 8,
      borderRadius: Spacing.radius.full,
      alignItems: "center",
      justifyContent: "center",
    };

    const variantStyles: Record<string, ViewStyle> = {
      kora: {
        backgroundColor: colors.secondary,
      },
      default: {
        backgroundColor: colors.muted,
      },
      success: {
        backgroundColor: colors.primary,
      },
      warning: {
        backgroundColor: colors.destructive,
      },
    };

    return { ...baseStyle, ...variantStyles[variant] };
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      ...Typography.gameXS,
    };

    const variantTextStyles: Record<string, TextStyle> = {
      kora: {
        color: colors.secondaryForeground,
      },
      default: {
        color: colors.mutedForeground,
      },
      success: {
        color: colors.primaryForeground,
      },
      warning: {
        color: colors.destructiveForeground,
      },
    };

    return { ...baseStyle, ...variantTextStyles[variant] };
  };

  return (
    <View style={[getBadgeStyle(), style]}>
      <Text style={[getTextStyle(), textStyle]}>{label}</Text>
    </View>
  );
}
