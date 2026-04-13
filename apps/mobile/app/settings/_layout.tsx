import { Stack, useRouter } from "expo-router";

import { RequireAuth } from "@/components/auth/RouteGate";
import { HeaderBackButton } from "@/navigation/header-buttons";
import { useThemeColors } from "@/theme";
import { getSeamlessHeaderOptions } from "@/theme/headers";

export default function SettingsLayout() {
  const colors = useThemeColors();
  const router = useRouter();

  return (
    <RequireAuth>
      <Stack
        screenOptions={{
          ...getSeamlessHeaderOptions(colors.background),
          headerLeft: () => (
            <HeaderBackButton onPress={() => router.back()} />
          ),
          headerTintColor: colors.primaryInk,
        }}
      >
        {/* Index (main settings list) — header provided by parent stack/tab */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
    </RequireAuth>
  );
}
