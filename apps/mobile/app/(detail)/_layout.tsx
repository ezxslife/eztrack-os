import { Stack } from "expo-router";

import { RequireAuth } from "@/components/auth/RouteGate";
import { DETAIL_ROUTE_METADATA } from "@/navigation/route-metadata";
import { buildStackScreenOptions } from "@/navigation/stack-screen-options";
import { useThemeColors } from "@/theme";

export default function DetailLayout() {
  const colors = useThemeColors();

  return (
    <RequireAuth>
      <Stack>
        {Object.entries(DETAIL_ROUTE_METADATA).map(([name, metadata]) => (
          <Stack.Screen
            key={name}
            name={name}
            options={buildStackScreenOptions(colors, metadata)}
          />
        ))}
      </Stack>
    </RequireAuth>
  );
}
