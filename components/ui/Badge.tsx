import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '@/constants/theme';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';

interface BadgeProps {
  label: string;
  variant?: 'kora' | 'default' | 'success' | 'warning';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Badge({ label, variant = 'default', style, textStyle }: BadgeProps) {
  const badgeStyle = [
    styles.badge,
    variant === 'kora' && styles.kora,
    variant === 'default' && styles.default,
    variant === 'success' && styles.success,
    variant === 'warning' && styles.warning,
    style,
  ];

  const labelStyle = [
    styles.text,
    variant === 'kora' && styles.koraText,
    variant === 'default' && styles.defaultText,
    variant === 'success' && styles.successText,
    variant === 'warning' && styles.warningText,
    textStyle,
  ];

  return (
    <View style={badgeStyle}>
      <Text style={labelStyle}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 2, // py-0.5 (équivalent à 2px)
    paddingHorizontal: 8, // px-2
    borderRadius: Spacing.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kora: {
    backgroundColor: Colors.light.secondary,
  },
  default: {
    backgroundColor: Colors.light.muted,
  },
  success: {
    backgroundColor: Colors.light.primary,
  },
  warning: {
    backgroundColor: Colors.light.destructive,
  },
  text: {
    ...Typography.gameXS,
  },
  koraText: {
    color: Colors.light.secondaryForeground,
  },
  defaultText: {
    color: Colors.light.mutedForeground,
  },
  successText: {
    color: Colors.light.primaryForeground,
  },
  warningText: {
    color: Colors.light.destructiveForeground,
  },
});

