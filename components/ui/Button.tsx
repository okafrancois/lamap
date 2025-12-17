import { Spacing } from "@/constants/spacing";
import { Typography } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";
import { getButtonShadow, getButtonShadowHover } from "@/utils/shadows";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "destructive"
    | "oauth";
  size?: "sm" | "default" | "lg";
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "default",
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle: customTextStyle,
  accessibilityLabel,
  accessibilityHint,
}: ButtonProps) {
  const colors = useColors();
  const [isPressed, setIsPressed] = useState(false);

  const getButtonStyles = (): ViewStyle[] => {
    const shouldHaveShadow = variant !== "outline" && variant !== "ghost";

    const baseStyle: ViewStyle = {
      paddingVertical:
        size === "sm" ? 8
        : size === "lg" ? 14
        : 12,
      paddingHorizontal:
        size === "sm" ? 16
        : size === "lg" ? 32
        : 24,
      borderRadius: Spacing.radius.full,
      alignItems: "center",
      justifyContent: "center",
      minHeight:
        size === "sm" ? 32
        : size === "lg" ? 40
        : 36,
      ...(shouldHaveShadow ? getButtonShadow() : {}),
    };

    const variantStyles: Record<string, ViewStyle> = {
      primary: {
        backgroundColor: colors.primary,
      },
      secondary: {
        backgroundColor: colors.secondary,
      },
      outline: {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: colors.border,
      },
      ghost: {
        backgroundColor: "transparent",
      },
      destructive: {
        backgroundColor: colors.destructive,
      },
      oauth: {
        backgroundColor: "#FFFFFF",
      },
    };

    return [
      baseStyle,
      variantStyles[variant] || variantStyles.primary,
      ...(disabled ? [{ opacity: 0.5 }] : []),
      ...(isPressed && shouldHaveShadow ? [getButtonShadowHover()] : []),
    ];
  };

  const getTextStyles = (): TextStyle[] => {
    const baseStyle: TextStyle = {
      ...Typography.gameBase,
    };

    const variantTextStyles: Record<string, TextStyle> = {
      primary: {
        color: colors.primaryForeground,
      },
      secondary: {
        color: colors.secondaryForeground,
      },
      outline: {
        color: colors.foreground,
      },
      ghost: {
        color: colors.foreground,
      },
      destructive: {
        color: colors.destructiveForeground,
      },
      oauth: {
        color: "#1A1A1A",
      },
    };

    return [
      baseStyle,
      variantTextStyles[variant] || variantTextStyles.primary,
      ...(disabled ? [{ opacity: 0.6 }] : []),
    ];
  };

  const buttonStyle = [
    ...getButtonStyles(),
    ...(Array.isArray(style) ? style
    : style ? [style]
    : []),
  ];

  const textStyle = [
    ...getTextStyles(),
    ...(Array.isArray(customTextStyle) ? customTextStyle
    : customTextStyle ? [customTextStyle]
    : []),
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
    >
      {loading ?
        <ActivityIndicator
          color={
            (
              variant === "primary" ||
              variant === "destructive" ||
              variant === "secondary"
            ) ?
              colors.primaryForeground
            : colors.primary
          }
        />
      : <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {icon}
          <Text style={textStyle}>{title}</Text>
        </View>
      }
    </TouchableOpacity>
  );
}
