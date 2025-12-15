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
    text: '#1A1A1A',
    background: '#F5F2ED',
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
