import { Stack } from "expo-router";
import { useMemo } from "react";
import { Platform } from "react-native";

import { NativeHeaderProvider } from "@/navigation/NativeHeaderContext";
import { makeLiquidGlassHeaderOptions } from "@/navigation/native-header-items";
import { getBlurTabHeaderOptions } from "@/theme/headers";
import { useThemeColors } from "@/theme";

interface TabRootStackLayoutProps {
  title: string;
  screens?: Array<{
    name: string;
    options?: any;
  }>;
}

export function TabRootStackLayout({
  title,
  screens,
}: TabRootStackLayoutProps) {
  const colors = useThemeColors();

  const screenOptions = useMemo(
    () => ({
      ...getBlurTabHeaderOptions(colors.background),
      headerShown: Platform.OS === "ios",
      headerTintColor: colors.primaryInk,
      title: "",
    }),
    [colors.background, colors.primaryInk]
  );

  const indexOptions = useMemo(
    () => ({
      ...makeLiquidGlassHeaderOptions({
        title,
        backgroundColor: colors.background,
      }),
      // On Android, hide native header — ScreenTitleStrip renders the title
      headerShown: Platform.OS === "ios",
    }),
    [colors.background, title]
  );

  const subScreenOptions = useMemo(
    () =>
      screens?.map((screen) => ({
        ...screen,
        options: {
          headerShown: true,
          ...screen.options,
        },
      })),
    [screens]
  );

  return (
    <NativeHeaderProvider enabled={Platform.OS === "ios" ? true : undefined}>
      <Stack screenOptions={screenOptions}>
        <Stack.Screen name="index" options={indexOptions} />
        {subScreenOptions?.map((screen) => (
          <Stack.Screen
            key={screen.name}
            name={screen.name}
            options={screen.options}
          />
        ))}
      </Stack>
    </NativeHeaderProvider>
  );
}
