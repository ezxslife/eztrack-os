import {
  DynamicColorIOS,
  Platform,
  type ColorValue,
} from "react-native";

import { IOS_CONTROL_TOKENS } from "./controlTokens";
import type { ThemeColors } from "./colors";

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
      IOS_CONTROL_TOKENS.groupedBorder.light,
      IOS_CONTROL_TOKENS.groupedBorder.dark,
      colors.divider
    ),
    groupedSurface: iosColor(
      IOS_CONTROL_TOKENS.groupedSurface.light,
      IOS_CONTROL_TOKENS.groupedSurface.dark,
      colors.surface
    ),
    headerBackground: iosColor(
      IOS_CONTROL_TOKENS.headerBackground.light,
      IOS_CONTROL_TOKENS.headerBackground.dark,
      colors.background
    ),
    searchFieldFill: iosColor(
      IOS_CONTROL_TOKENS.searchFieldFill.light,
      IOS_CONTROL_TOKENS.searchFieldFill.dark,
      colors.surfaceSecondary
    ),
    secondaryButtonFill: iosColor(
      IOS_CONTROL_TOKENS.secondaryButtonFill.light,
      IOS_CONTROL_TOKENS.secondaryButtonFill.dark,
      colors.surfaceSecondary
    ),
    secondaryButtonLabel: iosColor(
      IOS_CONTROL_TOKENS.secondaryButtonLabel.light,
      IOS_CONTROL_TOKENS.secondaryButtonLabel.dark,
      colors.textPrimary
    ),
    switchTrackFalse: iosColor(
      IOS_CONTROL_TOKENS.switchTrackFalse.light,
      IOS_CONTROL_TOKENS.switchTrackFalse.dark,
      colors.surfaceSecondary
    ),
    switchTrackTrue: iosColor(
      IOS_CONTROL_TOKENS.switchTrackTrue.light,
      IOS_CONTROL_TOKENS.switchTrackTrue.dark,
      colors.primarySoft
    ),
  };
}
