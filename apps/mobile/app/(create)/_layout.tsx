import { Stack, useRouter } from "expo-router";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";

import { RequireAuth } from "@/components/auth/RouteGate";
import { HeaderBackButton } from "@/navigation/header-buttons";
import { NativeHeaderProvider } from "@/navigation/NativeHeaderContext";
import { CREATE_ROUTE_METADATA } from "@/navigation/route-metadata";
import { buildStackScreenOptions } from "@/navigation/stack-screen-options";
import { useThemeColors } from "@/theme";
import { getGlassHeaderOptions } from "@/theme/headers";

export default function CreateLayout() {
  const colors = useThemeColors();
  const router = useRouter();

  // ── Default screen options ──────────────────────────────────────────
  // Applied to ALL screens in this stack (registered & unregistered).
  // "new" screens override with their own Cancel + Save via <Stack.Screen options>.
  // Edit/sub-feature screens that DON'T set their own options inherit these
  // defaults — glass header styling, tint color, and a back button to return
  // to the parent detail screen.
  const defaultScreenOptions: NativeStackNavigationOptions = {
    ...getGlassHeaderOptions(colors.background),
    headerLeft: () => <HeaderBackButton onPress={() => router.back()} />,
    headerTintColor: colors.primaryInk,
    presentation: "card",
  };

  return (
    <RequireAuth>
      <NativeHeaderProvider enabled>
        <Stack screenOptions={defaultScreenOptions}>
          {Object.entries(CREATE_ROUTE_METADATA).map(([name, metadata]) => (
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
