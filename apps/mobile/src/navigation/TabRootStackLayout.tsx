import { Stack } from "expo-router";
import { useMemo } from "react";
import { Platform } from "react-native";

import { NativeHeaderProvider } from "@/navigation/NativeHeaderContext";
import { getBlurTabHeaderOptions } from "@/theme/headers";
import { useThemeColors } from "@/theme";

export function TabRootStackLayout({ title }: { title: string }) {
  const colors = useThemeColors();
  const screenOptions = useMemo(
    () => ({
      ...getBlurTabHeaderOptions(colors.background),
      headerLargeTitle: Platform.OS === "ios",
      headerLargeTitleShadowVisible: false,
      headerShown: Platform.OS === "ios",
      headerTintColor: colors.primaryInk,
    }),
    [colors.background, colors.primaryInk]
  );
  const indexOptions = useMemo(
    () => ({
      title,
    }),
    [title]
  );

  return (
    <NativeHeaderProvider enabled={Platform.OS === "ios" ? true : undefined}>
      <Stack screenOptions={screenOptions}>
        <Stack.Screen name="index" options={indexOptions} />
      </Stack>
    </NativeHeaderProvider>
  );
}
