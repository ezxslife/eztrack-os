/** Design token constants for use in JS/TS (mirrors CSS vars) */

export const BRAND = {
  primary: "#06B6D4",
  primaryLight: "#A5F3FC",
  primaryDark: "#0E5568",
  accent: "#F59E0B",
  accentLight: "#FEF3C7",
  accentDark: "#92400E",
} as const;

export const SURFACE = {
  bg: "#121212",
  surface: "#1a1a1a",
  surfaceSecondary: "#242424",
  surfaceTertiary: "#2e2e2e",
  borderCard: "#333333",
} as const;

export const TYPOGRAPHY = {
  fontSizeXs: "0.6875rem",
  fontSizeSm: "0.75rem",
  fontSizeBase: "0.8125rem",
  fontSizeMd: "0.875rem",
  fontSizeLg: "1rem",
  fontSizeXl: "1.25rem",
  fontSize2xl: "1.5rem",
  fontSize3xl: "1.875rem",
} as const;

export const SPACING = {
  0: "0",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
} as const;

export const SIDEBAR = {
  width: "240px",
  widthCollapsed: "64px",
  headerHeight: "56px",
  itemHeight: "32px",
} as const;

export const BREAKPOINTS = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;
