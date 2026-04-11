import { Stack } from "expo-router";

import { RequireAuth } from "@/components/auth/RouteGate";
import { NativeHeaderProvider } from "@/navigation/NativeHeaderContext";
import { SETTINGS_ROUTE_METADATA } from "@/navigation/route-metadata";
import { buildStackScreenOptions } from "@/navigation/stack-screen-options";
import { useThemeColors } from "@/theme";

export default function SettingsLayout() {
  const colors = useThemeColors();

  return (
    <RequireAuth>
      <NativeHeaderProvider enabled>
        <Stack>
          {Object.entries(SETTINGS_ROUTE_METADATA).map(([name, metadata]) => (
            <Stack.Screen
              key={name}
              name={name}
              options={buildStackScreenOptions(colors, metadata)}
            />
          ))}
        </Stack>
      </NativeHeaderProvider>
    </RequireAuth>
  );
}
