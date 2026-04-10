import { Stack } from "expo-router";

import { getTransparentBlurHeaderOptions } from "@/theme/headers";
import { useThemeColors } from "@/theme";

export default function SettingsLayout() {
  const colors = useThemeColors();

  return (
    <Stack
      screenOptions={{
        ...getTransparentBlurHeaderOptions(colors.background),
        headerTitle: "",
        headerTintColor: colors.textPrimary,
        headerShown: true,
      }}
    />
  );
}
