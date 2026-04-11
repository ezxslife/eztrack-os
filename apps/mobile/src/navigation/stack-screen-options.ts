import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";

import type { ThemeColors } from "@/theme/colors";
import {
  getHeaderModeOptions,
  type HeaderMode,
} from "@/theme/headers";

export interface RouteScreenMetadata {
  headerMode: HeaderMode;
  presentation?: NativeStackNavigationOptions["presentation"];
  title: string;
}

export function buildStackScreenOptions(
  colors: ThemeColors,
  metadata: RouteScreenMetadata
): NativeStackNavigationOptions {
  return {
    ...getHeaderModeOptions(metadata.headerMode, colors.background),
    ...(metadata.presentation
      ? { presentation: metadata.presentation }
      : null),
    headerTintColor: colors.primaryInk,
    title: metadata.title,
  };
}
