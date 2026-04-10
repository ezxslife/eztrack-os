import { Stack } from "expo-router";

import { RequireAuth } from "@/components/auth/RouteGate";
import { getSeamlessHeaderOptions } from "@/theme/headers";
import { useThemeColors } from "@/theme";

export default function CreateLayout() {
  const colors = useThemeColors();

  return (
    <RequireAuth>
      <Stack
        screenOptions={{
          ...getSeamlessHeaderOptions(colors.background),
          headerTitle: "",
          headerTintColor: colors.textPrimary,
          headerShown: true,
          presentation: "modal",
        }}
      />
    </RequireAuth>
  );
}
