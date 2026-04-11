import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { Pressable } from "react-native";

import { RequireAuth } from "@/components/auth/RouteGate";
import { NativeHeaderProvider } from "@/navigation/NativeHeaderContext";
import { platformHeaderItems } from "@/navigation/native-header-items";
import { CREATE_ROUTE_METADATA } from "@/navigation/route-metadata";
import { buildStackScreenOptions } from "@/navigation/stack-screen-options";
import { useThemeColors } from "@/theme";

export default function CreateLayout() {
  const colors = useThemeColors();
  const router = useRouter();
  const closeItems = platformHeaderItems({
    rightNative: [
      {
        icon: { name: "xmark", type: "sfSymbol" },
        label: "Close",
        onPress: () => router.back(),
        tintColor: colors.primaryInk,
        type: "button",
      },
    ],
    rightReact: () => (
      <Pressable
        accessibilityLabel="Close"
        accessibilityRole="button"
        onPress={() => router.back()}
        style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1, paddingHorizontal: 6 })}
      >
        <Ionicons color={colors.primaryInk} name="close" size={22} />
      </Pressable>
    ),
  });

  return (
    <RequireAuth>
      <NativeHeaderProvider enabled>
        <Stack>
          {Object.entries(CREATE_ROUTE_METADATA).map(([name, metadata]) => (
            <Stack.Screen
              key={name}
              name={name}
              options={{
                ...buildStackScreenOptions(colors, metadata),
                ...closeItems,
              }}
            />
          ))}
        </Stack>
      </NativeHeaderProvider>
    </RequireAuth>
  );
}
