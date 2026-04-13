import { Stack } from "expo-router";

import { NativeHeaderProvider } from "@/navigation/NativeHeaderContext";
import { STANDALONE_ROUTE_METADATA } from "@/navigation/route-metadata";
import { buildStackScreenOptions } from "@/navigation/stack-screen-options";
import { useThemeColors } from "@/theme";

export default function VisitorCheckInLayout() {
  const colors = useThemeColors();

  return (
    <NativeHeaderProvider enabled>
      <Stack>
        <Stack.Screen
          name="index"
          options={buildStackScreenOptions(colors, {
            headerMode: "seamless",
            title: "Visitor Check-in",
          })}
        />
      </Stack>
    </NativeHeaderProvider>
  );
}
