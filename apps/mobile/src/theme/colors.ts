import { BRAND } from "@eztrack/ui";

export const brand = {
  primary: BRAND.primary,
  primaryLight: BRAND.primaryLight,
  primaryDark: BRAND.primaryDark,
  accent: BRAND.accent,
  accentLight: BRAND.accentLight,
  accentDark: BRAND.accentDark,
} as const;

export type ResolvedThemeScheme = "light" | "dark";
export type ThemePreference = "system" | ResolvedThemeScheme;

export interface ThemeColors {
  background: string;
  backgroundMuted: string;
  surface: string;
  surfaceElevated: string;
  surfaceSecondary: string;
  surfaceTertiary: string;
  surfaceOverlay: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  border: string;
  borderSubtle: string;
  borderStrong: string;
  divider: string;
  primary: string;
  primaryStrong: string;
  primarySoft: string;
  primaryText: string;
  accent: string;
  accentSoft: string;
  accentText: string;
  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  error: string;
  errorBg: string;
  info: string;
  infoBg: string;
  glassTint: string;
  glassSpecular: string;
  chrome: string;
  chromeStrong: string;
  shadow: string;
  input: string;
  focusRing: string;
}

export const lightColors: ThemeColors = {
  background: "#F2F2F7",
  backgroundMuted: "#EDEDF3",
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",
  surfaceSecondary: "#F7F7FA",
  surfaceTertiary: "#E5E5EA",
  surfaceOverlay: "rgba(255, 255, 255, 0.84)",
  textPrimary: "#111827",
  textSecondary: "#4B5563",
  textTertiary: "#6B7280",
  textInverse: "#FFFFFF",
  border: "#D1D5DB",
  borderSubtle: "#E5E7EB",
  borderStrong: "#B6BCC6",
  divider: "rgba(17, 24, 39, 0.08)",
  primary: brand.primary,
  primaryStrong: "#0891B2",
  primarySoft: "rgba(6, 182, 212, 0.12)",
  primaryText: "#FFFFFF",
  accent: brand.accent,
  accentSoft: "#B45309",
  accentText: "#FFFFFF",
  success: "#059669",
  successBg: "#D1FAE5",
  warning: "#D97706",
  warningBg: "#FEF3C7",
  error: "#DC2626",
  errorBg: "#FEE2E2",
  info: "#2563EB",
  infoBg: "#DBEAFE",
  glassTint: "rgba(255, 255, 255, 0.74)",
  glassSpecular: "rgba(255, 255, 255, 0.48)",
  chrome: "rgba(255, 255, 255, 0.72)",
  chromeStrong: "rgba(255, 255, 255, 0.9)",
  shadow: "rgba(15, 23, 42, 0.12)",
  input: "rgba(255, 255, 255, 0.82)",
  focusRing: "rgba(6, 182, 212, 0.24)",
};

export const darkColors: ThemeColors = {
  background: "#000000",
  backgroundMuted: "#08090C",
  surface: "#17181C",
  surfaceElevated: "#1F2126",
  surfaceSecondary: "#262931",
  surfaceTertiary: "#313540",
  surfaceOverlay: "rgba(12, 13, 17, 0.8)",
  textPrimary: "#FAFAFA",
  textSecondary: "#D1D5DB",
  textTertiary: "#9CA3AF",
  textInverse: "#111827",
  border: "#343844",
  borderSubtle: "#262A34",
  borderStrong: "#414656",
  divider: "rgba(255, 255, 255, 0.08)",
  primary: brand.primary,
  primaryStrong: "#67E8F9",
  primarySoft: "rgba(6, 182, 212, 0.18)",
  primaryText: "#041317",
  accent: brand.accent,
  accentSoft: "#FCD34D",
  accentText: "#1A1204",
  success: "#34D399",
  successBg: "rgba(16, 185, 129, 0.18)",
  warning: "#FBBF24",
  warningBg: "rgba(245, 158, 11, 0.18)",
  error: "#F87171",
  errorBg: "rgba(239, 68, 68, 0.18)",
  info: "#60A5FA",
  infoBg: "rgba(59, 130, 246, 0.18)",
  glassTint: "rgba(7, 8, 11, 0.52)",
  glassSpecular: "rgba(255, 255, 255, 0.14)",
  chrome: "rgba(10, 11, 15, 0.72)",
  chromeStrong: "rgba(4, 5, 8, 0.9)",
  shadow: "rgba(0, 0, 0, 0.4)",
  input: "rgba(18, 19, 24, 0.88)",
  focusRing: "rgba(103, 232, 249, 0.22)",
};

export function createThemeColors(scheme: ResolvedThemeScheme) {
  return scheme === "dark" ? darkColors : lightColors;
}

export const colors = {
  brand: {
    primary: darkColors.primary,
    primaryStrong: darkColors.primaryStrong,
    accent: darkColors.accent,
    accentSoft: darkColors.accentSoft,
  },
  surface: {
    background: darkColors.background,
    card: darkColors.surface,
    cardAlt: darkColors.surfaceSecondary,
    cardRaised: darkColors.surfaceElevated,
    chrome: darkColors.chrome,
    chromeStrong: darkColors.chromeStrong,
    border: darkColors.border,
    divider: darkColors.divider,
  },
  text: {
    primary: darkColors.textPrimary,
    secondary: darkColors.textSecondary,
    muted: darkColors.textTertiary,
    tertiary: darkColors.textTertiary,
  },
  feedback: {
    success: darkColors.success,
    warning: darkColors.warning,
    danger: darkColors.error,
  },
} as const;
