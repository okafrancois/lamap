import { Platform } from 'react-native';

export const Colors = {
  primary: {
    red: '#B4443E',
    gold: '#A68258',
    blue: '#465D74',
  },
  derived: {
    blueDark: '#2E3D4D',
    blueLight: '#5A7A96',
    redLight: '#D4635D',
    goldLight: '#C9A876',
    white: '#F5F2ED',
    black: '#1A1A1A',
  },
  light: {
    background: '#FAFAF9',
    foreground: '#1A1A1A',
    card: '#FEFEFD',
    cardForeground: '#2A2A28',
    primary: '#B4443E',
    primaryForeground: '#FFFFFF',
    secondary: '#A68258',
    secondaryForeground: '#FFFFFF',
    muted: '#EBEBE8',
    mutedForeground: '#6B6B68',
    accent: '#E8E0D4',
    accentForeground: '#1A1A1A',
    destructive: '#D32F2F',
    destructiveForeground: '#FFFFFF',
    border: '#D9D1C4',
    input: '#F0F0ED',
    ring: '#B4443E',
    text: '#1A1A1A',
    tint: '#B4443E',
    icon: '#465D74',
    tabIconDefault: '#5A7A96',
    tabIconSelected: '#B4443E',
  },
  dark: {
    text: '#F5F2ED',
    background: '#2E3D4D',
    tint: '#A68258',
    icon: '#5A7A96',
    tabIconDefault: '#5A7A96',
    tabIconSelected: '#A68258',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
