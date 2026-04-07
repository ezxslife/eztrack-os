import { Stack } from "expo-router";

import { RequireAuth } from "@/components/auth/RouteGate";
import { getTransparentBlurHeaderOptions } from "@/theme/headers";
import { useThemeColors } from "@/theme";

export default function DetailLayout() {
  const colors = useThemeColors();

  return (
    <RequireAuth>
      <Stack
        screenOptions={{
          ...getTransparentBlurHeaderOptions(colors.background),
          headerTitle: "",
          headerTintColor: colors.textPrimary,
          headerShown: true,
        }}
      />
    </RequireAuth>
  );
}
