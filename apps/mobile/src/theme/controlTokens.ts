import { BRAND } from "@eztrack/ui";

export const IOS_CONTROL_TOKENS = {
  groupedBorder: {
    dark: "rgba(84, 84, 88, 0.36)",
    light: "rgba(60, 60, 67, 0.12)",
  },
  groupedSurface: {
    dark: "rgba(28, 28, 30, 0.92)",
    light: "rgba(255, 255, 255, 0.94)",
  },
  headerBackground: {
    dark: "rgba(0, 0, 0, 0.92)",
    light: "rgba(242, 242, 247, 0.94)",
  },
  searchFieldFill: {
    dark: "rgba(118, 118, 128, 0.24)",
    light: "rgba(118, 118, 128, 0.12)",
  },
  secondaryButtonFill: {
    dark: "rgba(118, 118, 128, 0.24)",
    light: "rgba(118, 118, 128, 0.12)",
  },
  secondaryButtonLabel: {
    dark: BRAND.primaryLight,
    light: BRAND.primaryDark,
  },
  switchTrackFalse: {
    dark: "rgba(118, 118, 128, 0.32)",
    light: "rgba(120, 120, 128, 0.16)",
  },
  switchTrackTrue: {
    dark: "rgba(8, 145, 178, 0.72)",
    light: "#0891B2",
  },
} as const;
