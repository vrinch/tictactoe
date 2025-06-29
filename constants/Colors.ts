// All main brand colors, organized by usage and shade
export const COLORS = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Main primary brand color
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  secondary: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444', // Main accent color
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  success: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981', // Pass/success state
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // Strong warning
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444', // Error state
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
} as const;

// Convenient, theme-based color mapping for light and dark mode
export const Colors = {
  light: {
    background: COLORS.white, // Main app background (light mode)
    surface: COLORS.neutral[50], // Card and modal surfaces
    card: COLORS.white, // Used on card backgrounds
    text: COLORS.neutral[900], // Main text color
    textSecondary: COLORS.neutral[600], // Subtle text color
    textMuted: COLORS.neutral[400], // Muted descriptions/icons
    border: COLORS.neutral[200], // Standard border around elements
    borderLight: COLORS.neutral[100], // Extra light border for dividers
    primary: COLORS.primary[500], // Main primary
    primaryLight: COLORS.primary[100], // Soft primary for focus states
    primaryDark: COLORS.primary[700], // Used for selected/active
    secondary: COLORS.secondary[500], // Accent secondary
    secondaryLight: COLORS.secondary[100],
    secondaryDark: COLORS.secondary[700],
    success: COLORS.success[500], // Success highlights
    warning: COLORS.warning[500], // Warning highlights
    error: COLORS.error[500], // Error highlights
    playerX: COLORS.primary[500], // X player color
    playerO: COLORS.secondary[500], // O player color
    cellEmpty: COLORS.neutral[50], // Empty cell background
    cellHighlight: COLORS.warning[100], // Move preview/cell highlight
    winningCell: COLORS.success[100], // Winning combo highlight
    shadow: COLORS.black, // Drop shadow
    overlay: 'rgba(0, 0, 0, 0.5)', // Overlay for modals
    disabled: COLORS.neutral[300], // Disabled state
    tabIconDefault: COLORS.neutral[400], // Inactive tab icon
    tabIconSelected: COLORS.primary[500], // Active tab icon
  },
  dark: {
    background: COLORS.neutral[900], // App background (dark mode)
    surface: COLORS.neutral[800], // Card/modal background
    card: COLORS.neutral[800], // Card background
    text: COLORS.neutral[50], // Main light text
    textSecondary: COLORS.neutral[400], // Subtle text color
    textMuted: COLORS.neutral[600], // Muted/descriptions/icons
    border: COLORS.neutral[700], // Border color in dark mode
    borderLight: COLORS.neutral[800], // Soft border for dark cards
    primary: COLORS.primary[400], // Main accent in dark mode
    primaryLight: COLORS.primary[900],
    primaryDark: COLORS.primary[200],
    secondary: COLORS.secondary[400],
    secondaryLight: COLORS.secondary[900],
    secondaryDark: COLORS.secondary[200],
    success: COLORS.success[400],
    warning: COLORS.warning[400],
    error: COLORS.error[400],
    playerX: COLORS.primary[400],
    playerO: COLORS.secondary[400],
    cellEmpty: COLORS.neutral[800],
    cellHighlight: COLORS.warning[900],
    winningCell: COLORS.success[900],
    shadow: COLORS.black,
    overlay: 'rgba(0, 0, 0, 0.7)',
    disabled: COLORS.neutral[600],
    tabIconDefault: COLORS.neutral[500],
    tabIconSelected: COLORS.primary[400],
  },
} as const;

export type ColorScheme = keyof typeof Colors;
export type ThemeColors = typeof Colors.light;
