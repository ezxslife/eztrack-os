import {
  DynamicColorIOS,
  Platform,
  type ColorValue,
} from "react-native";

import type { ThemeColors } from "@/theme/colors";

export interface ThemeControls {
  groupedBorder: ColorValue;
  groupedSurface: ColorValue;
  headerBackground: ColorValue;
  searchFieldFill: ColorValue;
  secondaryButtonFill: ColorValue;
  secondaryButtonLabel: ColorValue;
  switchTrackFalse: ColorValue;
  switchTrackTrue: ColorValue;
}

function iosColor(light: string, dark: string, fallback: string) {
  if (Platform.OS !== "ios") {
    return fallback;
  }

  return DynamicColorIOS({
    dark,
    light,
  });
}

export function createThemeControls(colors: ThemeColors): ThemeControls {
  return {
    groupedBorder: iosColor(
      "rgba(60, 60, 67, 0.12)",
      "rgba(84, 84, 88, 0.36)",
      colors.divider
    ),
    groupedSurface: iosColor(
      "rgba(255, 255, 255, 0.94)",
      "rgba(28, 28, 30, 0.92)",
      colors.surface
    ),
    headerBackground: iosColor(
      "rgba(242, 242, 247, 0.94)",
      "rgba(0, 0, 0, 0.92)",
      colors.background
    ),
    searchFieldFill: iosColor(
      "rgba(118, 118, 128, 0.12)",
      "rgba(118, 118, 128, 0.24)",
      colors.surfaceSecondary
    ),
    secondaryButtonFill: iosColor(
      "rgba(118, 118, 128, 0.12)",
      "rgba(118, 118, 128, 0.24)",
      colors.surfaceSecondary
    ),
    secondaryButtonLabel: iosColor(
      colors.primaryStrong,
      colors.primaryStrong,
      colors.textPrimary
    ),
    switchTrackFalse: iosColor(
      "rgba(120, 120, 128, 0.16)",
      "rgba(118, 118, 128, 0.32)",
      colors.surfaceSecondary
    ),
    switchTrackTrue: iosColor(
      "rgba(8, 145, 178, 0.42)",
      "rgba(103, 232, 249, 0.64)",
      colors.primarySoft
    ),
  };
}
