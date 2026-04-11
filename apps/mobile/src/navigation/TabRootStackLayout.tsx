import { Stack } from "expo-router";
import { Platform } from "react-native";

import { NativeHeaderProvider } from "@/navigation/NativeHeaderContext";
import { getBlurTabHeaderOptions } from "@/theme/headers";
import { useThemeColors } from "@/theme";

export function TabRootStackLayout({ title }: { title: string }) {
  const colors = useThemeColors();

  return (
    <NativeHeaderProvider enabled={Platform.OS === "ios" ? true : undefined}>
      <Stack
        screenOptions={{
          ...getBlurTabHeaderOptions(colors.background),
          headerLargeTitle: Platform.OS === "ios",
          headerLargeTitleShadowVisible: false,
          headerShown: Platform.OS === "ios",
          headerTintColor: colors.primaryInk,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title,
          }}
        />
      </Stack>
    </NativeHeaderProvider>
  );
}
