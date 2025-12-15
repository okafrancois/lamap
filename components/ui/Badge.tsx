import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '@/constants/theme';

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
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kora: {
    backgroundColor: Colors.primary.gold,
  },
  default: {
    backgroundColor: Colors.derived.blueLight,
  },
  success: {
    backgroundColor: Colors.primary.red,
  },
  warning: {
    backgroundColor: Colors.derived.redLight,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  koraText: {
    color: Colors.derived.black,
  },
  defaultText: {
    color: Colors.derived.white,
  },
  successText: {
    color: Colors.derived.white,
  },
  warningText: {
    color: Colors.derived.white,
  },
});

