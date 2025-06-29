import { SCREEN_WIDTH } from './config';

// Reference width (iPhone 14 Pro)
const BASE_WIDTH = 393;

// Scales any size value based on current screen width
export const responsiveScale = (size: number, factor: number = 1): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const scaledSize = size * scale * factor;

  // Clamp for minimum and maximum to keep things readable
  const minSize = size * 0.85;
  const maxSize = size * 1.15;

  return Math.max(minSize, Math.min(scaledSize, maxSize));
};

// Makes font sizes flexible but still readable on all screens
export const responsiveFontSize = (size: number): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const scaledSize = size * scale;
  return Math.max(size * 0.9, Math.min(scaledSize, size * 1.1));
};

// Responsive spacing for layout (just a shortcut for scale)
export const responsiveSpacing = (spacing: number): number => {
  return responsiveScale(spacing, 1);
};

// Scales icons and rounds to nearest even number for sharper rendering
export const responsiveIconSize = (size: number): number => {
  const scaled = responsiveScale(size);
  return Math.round(scaled / 2) * 2;
};

// Theme values with scaling; use throughout the app for consistency
export const THEME = {
  scale: responsiveScale,
  fontSize: responsiveFontSize,
  spacing: responsiveSpacing,
  iconSize: responsiveIconSize,

  typography: {
    h1: responsiveFontSize(32),
    h2: responsiveFontSize(28),
    h3: responsiveFontSize(24),
    h4: responsiveFontSize(20),
    body: responsiveFontSize(16),
    bodySmall: responsiveFontSize(14),
    caption: responsiveFontSize(12),

    fontWeights: {
      normal: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },

    lineHeights: {
      tight: 1.2,
      normal: 1.4,
      relaxed: 1.6,
    },
  },

  spacing: {
    xs: responsiveSpacing(4),
    sm: responsiveSpacing(8),
    md: responsiveSpacing(16),
    lg: responsiveSpacing(24),
    xl: responsiveSpacing(32),
    xxl: responsiveSpacing(40),
  },

  borderRadius: {
    sm: responsiveScale(8),
    md: responsiveScale(12),
    lg: responsiveScale(16),
    xl: responsiveScale(24),
    full: 9999,
  },

  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 16,
    },
  },
} as const;

// Responsive font size constants (use these for consistency)
export const FONT_SIZES = {
  small: responsiveScale(14),
  medium: responsiveScale(16),
  large: responsiveScale(20),
  xlarge: responsiveScale(24),
  xxlarge: responsiveScale(32),
};

// Spacing constants for margin and padding
export const SPACING = {
  xs: responsiveScale(4),
  sm: responsiveScale(8),
  md: responsiveScale(16),
  lg: responsiveScale(24),
  xl: responsiveScale(32),
  xxl: responsiveScale(48),
};

export default THEME;
