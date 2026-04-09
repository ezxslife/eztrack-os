import { Stack } from "expo-router";
import { Platform } from "react-native";

import { useThemeColors } from "@/theme";

export function SearchableIndexStackLayout() {
  const colors = useThemeColors();

  return (
    <Stack
      screenOptions={{
        contentStyle: {
          backgroundColor: colors.background,
        },
        headerBackButtonDisplayMode: "minimal",
        headerBlurEffect:
          Platform.OS === "ios" ? "systemChromeMaterial" : undefined,
        headerLargeTitle: Platform.OS === "ios",
        headerLargeTitleShadowVisible: false,
        headerShadowVisible: false,
        headerShown: Platform.OS === "ios",
        headerStyle: {
          backgroundColor:
            Platform.OS === "ios" ? "transparent" : colors.background,
        },
      }}
    />
  );
}
