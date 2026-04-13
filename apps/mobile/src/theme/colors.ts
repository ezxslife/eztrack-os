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
  backgroundSecondary: string;
  backgroundTertiary: string;
  surface: string;
  surfaceElevated: string;
  surfaceSecondary: string;
  surfaceTertiary: string;
  surfaceOverlay: string;
  surfaceTintSubtle: string;
  surfaceTintMedium: string;
  surfaceTintStrong: string;
  surfaceFrosted: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  border: string;
  borderSubtle: string;
  borderStrong: string;
  borderLight: string;
  borderEmphasis: string;
  divider: string;
  interactive: string;
  interactiveHover: string;
  interactiveDisabled: string;
  interactiveSolid: string;
  interactiveSolidText: string;
  primary: string;
  primaryInk: string;
  primaryStrong: string;
  primarySoft: string;
  primaryText: string;
  buttonPrimary: string;
  buttonPrimaryText: string;
  selectionBg: string;
  selectionBorder: string;
  selectionText: string;
  focusBorder: string;
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
  iconChromeBg: string;
  iconChromeFg: string;
  brand: string;
  brandText: string;
  brandContrastText: string;
  foreground: string;
  overlay: string;
  primaryLight: string;
  successBackground: string;
  successForeground: string;
  surfaceGrouped: string;
  surfacePrimary: string;
  text: string;
}

export const lightColors: ThemeColors = {
  background: "#F2F2F7",
  backgroundMuted: "#EFEFF4",
  backgroundSecondary: "#EFEFF4",
  backgroundTertiary: "#E5E5EA",
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",
  surfaceSecondary: "#F7F5FA",
  surfaceTertiary: "#F2EFF7",
  surfaceOverlay: "rgba(255, 255, 255, 0.84)",
  surfaceTintSubtle: "rgba(0,0,0,0.03)",
  surfaceTintMedium: "rgba(0,0,0,0.05)",
  surfaceTintStrong: "rgba(0,0,0,0.08)",
  surfaceFrosted: "rgba(242,242,247,0.8)",
  surfaceContainerLowest: "#FFFFFF",
  surfaceContainerLow: "#F7F5FA",
  surfaceContainer: "#F2EFF7",
  surfaceContainerHigh: "#ECE9F1",
  surfaceContainerHighest: "#E6E1E9",
  textPrimary: "#1F2937",
  textSecondary: "#6B7280",
  textTertiary: "#71717A",
  textInverse: "#FFFFFF",
  border: "#D1D5DB",
  borderSubtle: "#E5E7EB",
  borderStrong: "#C7C7CC",
  borderLight: "#E5E7EB",
  borderEmphasis: "#C7C7CC",
  divider: "rgba(17, 24, 39, 0.08)",
  interactive: "#0891B2",
  interactiveHover: "#0E7490",
  interactiveDisabled: "#D1D5DB",
  interactiveSolid: "#0E7490",
  interactiveSolidText: "#FFFFFF",
  primary: brand.primary,
  primaryInk: "#0E7490",
  primaryStrong: "#0E7490",
  primarySoft: "rgba(6, 182, 212, 0.12)",
  primaryText: "#FFFFFF",
  buttonPrimary: "#1A1A1A",
  buttonPrimaryText: "#FFFFFF",
  selectionBg: "#E5E5EA",
  selectionBorder: "#1F2937",
  selectionText: "#1F2937",
  focusBorder: "#1F2937",
  accent: brand.accent,
  accentSoft: "#EA580C",
  accentText: "#1A1204",
  success: "#047857",
  successBg: "#D1FAE5",
  warning: "#F59E0B",
  warningBg: "#FEF3C7",
  error: "#DC2626",
  errorBg: "#FEE2E2",
  info: "#06B6D4",
  infoBg: "#DBEAFE",
  glassTint: "rgba(255, 255, 255, 0.74)",
  glassSpecular: "rgba(255, 255, 255, 0.48)",
  chrome: "rgba(255, 255, 255, 0.72)",
  chromeStrong: "rgba(255, 255, 255, 0.9)",
  shadow: "rgba(15, 23, 42, 0.12)",
  input: "#F7F5FA",
  focusRing: "rgba(8, 145, 178, 0.24)",
  iconChromeBg: "#E5E5EA",
  iconChromeFg: "#1F2937",
  brand: "#0891B2",
  brandText: "#0E7490",
  brandContrastText: "#FFFFFF",
  foreground: "#1F2937",
  overlay: "rgba(255, 255, 255, 0.84)",
  primaryLight: brand.primaryLight,
  successBackground: "#D1FAE5",
  successForeground: "#047857",
  surfaceGrouped: "#F7F5FA",
  surfacePrimary: "#FFFFFF",
  text: "#1F2937",
};

export const darkColors: ThemeColors = {
  background: "#000000",
  backgroundMuted: "#161618",
  backgroundSecondary: "#161618",
  backgroundTertiary: "#232326",
  surface: "#1C1C1E",
  surfaceElevated: "#2C2C2E",
  surfaceSecondary: "#1D1B20",
  surfaceTertiary: "#211F26",
  surfaceOverlay: "rgba(10, 15, 23, 0.8)",
  surfaceTintSubtle: "rgba(255,255,255,0.07)",
  surfaceTintMedium: "rgba(255,255,255,0.08)",
  surfaceTintStrong: "rgba(255,255,255,0.12)",
  surfaceFrosted: "rgba(10,15,23,0.8)",
  surfaceContainerLowest: "#0F0D13",
  surfaceContainerLow: "#1D1B20",
  surfaceContainer: "#211F26",
  surfaceContainerHigh: "#2B2930",
  surfaceContainerHighest: "#36343B",
  textPrimary: "#FAFAFA",
  textSecondary: "#A1A1AA",
  textTertiary: "#A1A1AA",
  textInverse: "#0A0A0B",
  border: "rgba(255,255,255,0.20)",
  borderSubtle: "rgba(255,255,255,0.10)",
  borderStrong: "rgba(255,255,255,0.18)",
  borderLight: "rgba(255,255,255,0.10)",
  borderEmphasis: "rgba(255,255,255,0.18)",
  divider: "rgba(255, 255, 255, 0.08)",
  interactive: "#22D3EE",
  interactiveHover: "#67E8F9",
  interactiveDisabled: "#52525B",
  interactiveSolid: "#0E7490",
  interactiveSolidText: "#FFFFFF",
  primary: brand.primary,
  primaryInk: "#67E8F9",
  primaryStrong: "#0E7490",
  primarySoft: "rgba(8, 145, 178, 0.24)",
  primaryText: "#FFFFFF",
  buttonPrimary: "#FFFFFF",
  buttonPrimaryText: "#0A0A0B",
  selectionBg: "#232326",
  selectionBorder: "#FAFAFA",
  selectionText: "#FAFAFA",
  focusBorder: "#FAFAFA",
  accent: brand.accent,
  accentSoft: "#FB923C",
  accentText: "#1A1204",
  success: "#10B981",
  successBg: "rgba(16, 185, 129, 0.18)",
  warning: "#F59E0B",
  warningBg: "rgba(245, 158, 11, 0.18)",
  error: "#EF4444",
  errorBg: "rgba(239, 68, 68, 0.12)",
  info: "#06B6D4",
  infoBg: "rgba(59, 130, 246, 0.18)",
  glassTint: "rgba(7, 8, 11, 0.52)",
  glassSpecular: "rgba(255, 255, 255, 0.14)",
  chrome: "rgba(10, 11, 15, 0.72)",
  chromeStrong: "rgba(4, 5, 8, 0.9)",
  shadow: "rgba(0, 0, 0, 0.4)",
  input: "#1D1B20",
  focusRing: "rgba(34, 211, 238, 0.24)",
  iconChromeBg: "#232326",
  iconChromeFg: "#FAFAFA",
  brand: "#0891B2",
  brandText: "#67E8F9",
  brandContrastText: "#FFFFFF",
  foreground: "#FAFAFA",
  overlay: "rgba(10, 15, 23, 0.8)",
  primaryLight: brand.primaryLight,
  successBackground: "rgba(16, 185, 129, 0.18)",
  successForeground: "#10B981",
  surfaceGrouped: "#1D1B20",
  surfacePrimary: "#1C1C1E",
  text: "#FAFAFA",
};

export function createThemeColors(scheme: ResolvedThemeScheme) {
  return scheme === "dark" ? darkColors : lightColors;
}

export const colors = {
  brand: {
    primary: darkColors.primary,
    primaryInk: darkColors.primaryInk,
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
