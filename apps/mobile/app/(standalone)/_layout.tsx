import { Stack, useRouter } from "expo-router";

import { RequireAuth } from "@/components/auth/RouteGate";
import { HeaderBackButton } from "@/navigation/header-buttons";
import { NativeHeaderProvider } from "@/navigation/NativeHeaderContext";
import { STANDALONE_ROUTE_METADATA } from "@/navigation/route-metadata";
import { buildStackScreenOptions } from "@/navigation/stack-screen-options";
import { useThemeColors } from "@/theme";

export default function StandaloneLayout() {
  const colors = useThemeColors();
  const router = useRouter();

  return (
    <RequireAuth>
      <NativeHeaderProvider enabled>
        <Stack>
          {Object.entries(STANDALONE_ROUTE_METADATA).map(
            ([name, metadata]) => {
              const options = buildStackScreenOptions(colors, metadata);
              // Modal-mode screens use Cancel/Close buttons, not back chevrons.
              const needsBack = metadata.headerMode !== "modal";
              return (
                <Stack.Screen
                  key={name}
                  name={name}
                  options={{
                    ...options,
                    ...(needsBack
                      ? {
                          headerLeft: () => (
                            <HeaderBackButton
                              onPress={() => router.back()}
                            />
                          ),
                        }
                      : {}),
                  }}
                />
              );
            }
          )}
        </Stack>
      </NativeHeaderProvider>
    </RequireAuth>
  );
}
