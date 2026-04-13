import { Stack } from "expo-router";

import { useThemeColors } from "@/theme";
import { buildStackScreenOptions } from "@/navigation/stack-screen-options";

export default function ShiftHandoffLayout() {
  const colors = useThemeColors();

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={buildStackScreenOptions(colors, {
          headerMode: "seamless",
          title: "Shift Handoff",
        })}
      />
    </Stack>
  );
}
