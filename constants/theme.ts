import { Platform } from 'react-native';

const palette = {
  navyTop: '#0F1B3D',
  navyBottom: '#0A1330',
  card: '#12224F',
  accent: '#355CFF',
  accentSoft: '#2B45C6',
  textPrimary: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.72)',
  textDim: 'rgba(255,255,255,0.6)',
};

export const Colors = {
  light: {
    text: palette.textPrimary,
    textMuted: palette.textMuted,
    textDim: palette.textDim,
    background: palette.navyBottom,
    backgroundGradient: [palette.navyTop, palette.navyBottom] as const,
    card: palette.card,
    cardOverlay: 'rgba(18, 34, 79, 0.7)',
    accent: palette.accent,
    accentSoft: palette.accentSoft,
    tabIconDefault: palette.textDim,
    tabIconSelected: palette.accent,
  },
  dark: {
    text: palette.textPrimary,
    textMuted: palette.textMuted,
    textDim: palette.textDim,
    background: palette.navyBottom,
    backgroundGradient: [palette.navyTop, palette.navyBottom] as const,
    card: palette.card,
    cardOverlay: 'rgba(18, 34, 79, 0.82)',
    accent: palette.accent,
    accentSoft: palette.accentSoft,
    tabIconDefault: palette.textDim,
    tabIconSelected: palette.accent,
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
