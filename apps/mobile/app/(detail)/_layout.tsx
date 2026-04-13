import { Stack, useRouter } from "expo-router";

import { RequireAuth } from "@/components/auth/RouteGate";
import { HeaderBackButton } from "@/navigation/header-buttons";
import { NativeHeaderProvider } from "@/navigation/NativeHeaderContext";
import { DETAIL_ROUTE_METADATA } from "@/navigation/route-metadata";
import { buildStackScreenOptions } from "@/navigation/stack-screen-options";
import { useThemeColors } from "@/theme";

export default function DetailLayout() {
  const colors = useThemeColors();
  const router = useRouter();

  return (
    <RequireAuth>
      <NativeHeaderProvider enabled>
        <Stack
          screenOptions={{
            headerLeft: () => (
              <HeaderBackButton onPress={() => router.back()} />
            ),
          }}
        >
          {Object.entries(DETAIL_ROUTE_METADATA).map(([name, metadata]) => (
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
